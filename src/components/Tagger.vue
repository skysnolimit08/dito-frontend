<template>
	<div class="flex-auto" @mousedown.left="mouseHighlighting = true" @mouseup.left="mouseHighlighting = false">
		<span class="py-1 font-bold border-gray-300 rounded ">{{ title }}</span>
		in <span class="py-1 border-gray-300 rounded">{{ language_name }}</span><br /><br>

		<div class="w-full h-full py-1 border-gray-300 rounded tagger" :style="{ 'font-size': fontsize + 'px' }"
			style="overflow: scroll; height:47.5vh;">
			<span v-for="character in latest_text_character_array" :key="character.index">
				<span v-if="character.value == '\n'">
					<span style="white-space: pre-wrap">{{ character.value }}</span></span>
				<span v-else-if="!new_associations[character.index + deletedfrombeginningIndex.length]">
					<span @click="addNewAssociation(character.index + deletedfrombeginningIndex.length)"
						@mouseover.exact="addNewAssociationDrag(character.index + deletedfrombeginningIndex.length)"
						@mouseleave.exact="addNewAssociationDrag(character.index + deletedfrombeginningIndex.length)"
						style="white-space: pre-wrap">{{ character.value }}{{ spaced_by }}</span></span>
				<span v-else class="font-extrabold text-green-500" style="white-space: pre-wrap"
					@click="removeThisAssociation(character.index + deletedfrombeginningIndex.length)"
					@mouseover.alt.exact="removeThisAssociationDrag(character.index + deletedfrombeginningIndex.length)"
					@mouseleave.alt.exact="removeThisAssociationDrag(character.index + deletedfrombeginningIndex.length)">{{
						character.value }}{{ spaced_by }}</span>
			</span>
		</div>
		<br /><br />

	</div>
</template>

<script>
import { getIdToken } from "firebase/auth";

export default {
	name: "Tagger",
	inheritAttrs: false,
	data: () => {
		return {
			language_name: "",
			title: "",
			latest_text: "",
			parsedAssociations: [],
			associations: null,
			startingindex: 0,
			deletedfrombeginningIndex: 0,
			endingindex: 0,
			latest_text_part: "",
			latest_text_character_array: [],
			new_associations: {},
			spaced_by: "",
			mouseHighlighting: false,
		};
	},
	watch: {
		clearTimestampsvar: function () {
			this.clearTimestamps();
		},
		// clearOldTimestampsvar: function () {
		// 	this.clearOldTimestamps();
		// },
		updateAssociations: function () {
			this.updateAssociationsfunc();
		},
		// "$store.state.startTimePrompter": function () {
		// 	this.clipText();
		// },
		// "$store.state.endTimePrompter": function () {
		// 	this.clipText();
		// },
	},
	props: {
		clearTimestampsvar: {
			default: 0,
		},
		fontsize: { default: 12 },
		// clearOldTimestampsvar: {
		// 	default: 0,
		// },
		updateAssociations: {
			default: 0,
		},
		audio_id: {
			default: "",
		},
		interpretation_id: { default: "" },

		interpretationStatus: { default: "" },

		editingversion: { default: 0 },
	},

	async mounted() {
		// get the text
		if (this.$store.state.user) {
			// REFRESH ID TOKEN FIRST AND WAIT FOR IT
			await getIdToken(this.$store.state.user)
				.then((idToken) => {
					this.$store.commit("SetIdToken", idToken);
					// console.log(this.$store.state.idToken)
				})
				.catch((error) => {
					// An error happened.
					console.log("Oops. " + error.code + ": " + error.message);
				});
		}

		fetch(
			process.env.VUE_APP_api_URL +
			"interpretations/" +
			this.interpretation_id +
			"/audio/" +
			this.audio_id +
			"/" +
			this.interpretationStatus +
			"/",
			{
				method: "GET",

				headers: {
					"Content-Type": "application/json",

					Authorization: this.$store.state.idToken,
				},
			}
		)
			.then((response) => response.json())
			.then((data) => {
				this.title = data.interpretation.title;
				this.language_name = data.interpretation.language_name;
				this.latest_text = data.interpretation.latest_text;
				this.spaced_by = data.interpretation.spaced_by;
			})

			.then(() => {
				// get associations, set the index for the missing text, delete the extraneous text before and after, and convert the remaining text into an array of single characters or words
				this.adulterateText();
			})

			.catch((error) => console.error("Error:", error));
	},
	methods: {
		async adulterateText() {
			if (this.$store.state.user) {
				// REFRESH ID TOKEN FIRST AND WAIT FOR IT
				await getIdToken(this.$store.state.user)
					.then((idToken) => {
						this.$store.commit("SetIdToken", idToken);
						// console.log(this.$store.state.idToken)
					})
					.catch((error) => {
						// An error happened.
						console.log("Oops. " + error.code + ": " + error.message);
					});
			}

			fetch(
				process.env.VUE_APP_api_URL +
				"content/" +
				this.audio_id +
				"/" +
				this.interpretation_id +
				"/" +
				1 + // FLAG TIME DECISION
				"/", // timestep is 200 hundredths of seconds
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",

						Authorization: this.$store.state.idToken,
					},
				}
			)
				.then((response) => response.json())
				.then((data) => {
					this.associations = data.associations;
					// console.log(this.associations)
				})
				.then(() => this.handle_associations()) // turn the highlighting information from backend into something usable, then call clipText

				.catch((error) => console.error("Error:", error));
		},

		handle_associations: function () {
			this.parsedAssociations.length = 0;
			//Parse associations
			if (this.associations) {
				for (let i = 0; i < Object.keys(this.associations).length; i++) {
					let startTime = Object.keys(this.associations)[i].split("-")[0];
					let endTime = Object.keys(this.associations)[i].split("-")[1];
					let intervalsCount = Object.values(this.associations)[i].length;

					for (let j = 0; j < intervalsCount; j++) {
						let startCharacter = Object.values(this.associations)[i][j].split(
							"-"
						)[0];
						let endCharacter = Object.values(this.associations)[i][j].split(
							"-"
						)[1];

						let associationsObject = {};
						associationsObject.startTime = startTime;
						associationsObject.endTime = endTime;

						associationsObject.startCharacter = startCharacter;
						associationsObject.endCharacter = Number.parseInt(endCharacter) + 1;
						this.parsedAssociations.push(associationsObject);
					}
				}
				//set the index for the missing text and delete the extraneous text before and after
				this.clipText();
			}
		},

		clipText() {
			this.latest_text_character_array = [];
			// let deletefrombeginning = [];
			// let deletefromend = [];
			// let donotdelete = [];
			// this.parsedAssociations.forEach((group) => {
				//if the time in the parsed association is wholly before the current highlighted audio region
				// console.log(group.endTime)
				// console.log(this.$store.state.startTimePrompter*100)
				// if (group.endTime < this.$store.state.startTimePrompter * 100) {
				// 	deletefrombeginning.push(group.startCharacter);
				// 	deletefrombeginning.push(group.endCharacter);
				// }
				// //if the time in the parsed association is wholly after the current highlighted audio region
				// else if (group.startTime > this.$store.state.endTimePrompter * 100) {
				// 	deletefromend.push(group.startCharacter);
				// 	deletefromend.push(group.endCharacter);
				// }
				// if (
				// 	!(group.startTime >= this.$store.state.endTimePrompter * 100) &&
				// 	!(group.endTime <= this.$store.state.startTimePrompter * 100)
				// ) {
				// 	donotdelete.push(group.startCharacter);
				// 	donotdelete.push(group.endCharacter);
				// }
			// });
			// console.log(deletefrombeginning)
			// console.log(deletefromend)

			// if (donotdelete.length >= 2) {
			// 	this.startingindex = Math.min(...donotdelete);
			// 	this.endingindex = Math.max(...donotdelete);
			// } else {
				this.startingindex = 0;
				this.endingindex = this.latest_text.length;
			// }
			// console.log(donotdelete);
			// if (deletefrombeginning.length >= 1) {
			// 	this.startingindex = Math.max(...deletefrombeginning);
			// } else {
			// 	this.startingindex = 0;
			// }
			// // console.log("starting index is " + this.startingindex);
			// if (deletefromend.length >= 1) {
			// 	// console.log("hey")
			// 	this.endingindex = Math.min(...deletefromend);
			// } else {
			// 	// console.log("hi")
			// 	this.endingindex = this.latest_text.length;
			// }
			this.latest_text_part = this.latest_text.substring(
				this.startingindex,
				this.endingindex
			);
			// console.log(this.latest_text_part)
			let regexwithspacedby = new RegExp(
				`${this.escapeRegex(this.spaced_by)}|(\n)`
			);
			// console.log(this.latest_text.substring(0,this.startingindex).split(regexwithspacedby))

			this.deletedfrombeginningIndex = this.latest_text
				.substring(0, this.startingindex)
				.split(regexwithspacedby);

			for (let j = this.deletedfrombeginningIndex.length; j >= 0; j--) {
				if (
					this.deletedfrombeginningIndex[j] === undefined ||
					this.deletedfrombeginningIndex[j] == ""
				) {
					this.deletedfrombeginningIndex.splice(j, 1);
				} // second parameter being 1 means remove 1 element only
			}
			// console.log(this.deletedfrombeginningIndex)

			// console.log(this.deletedfrombeginningIndex.length)
			// console.log(this.latest_text)
			// console.log(this.latest_text_part)

			// convert the remaining text into an array of single characters or words

			let character_array = this.latest_text_part.split(regexwithspacedby);
			// console.log(character_array)
			for (let j = character_array.length; j >= 0; j--) {
				if (character_array[j] === undefined || character_array[j] == "") {
					character_array.splice(j, 1);
				} // second parameter being 1 means remove 1 element only
			}
			// console.log(character_array)

			for (let i = 0; i < character_array.length; i++) {
				let sample_object = {};
				sample_object.index = i;
				sample_object.value = character_array[i];
				// sample_object.newtag = false;
				// console.log(sample_object)
				this.latest_text_character_array.push(sample_object);
			}
		},

		escapeRegex: function (string) {
			return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
		},

		clearTimestamps() {
			for (let prop in this.new_associations) {
				delete this.new_associations[prop];
			}
			// this.new_associations = {};
			// console.log(JSON.stringify(this.new_associations));
			// for (let k = 0; k < this.latest_text_character_array.length; k++) {
			// 	this.latest_text_character_array[k].newtag = false;
			// }
		},

		// clearOldTimestamps() {
		// 	for (let k = 0; k < this.latest_text_character_array.length; k++) {
		// 		this.addNewNullAssociation(k);
		// 	}

		// 	this.updateAssociationsfunc();
		// },

		// if you click on a character that you have tagged in this session, it untags it
		removeThisAssociation(characterindex) {
			// this.latest_text_character_array[
			// 	characterindex - this.deletedfrombeginningIndex.length
			// ].newtag = false;
			delete this.new_associations[characterindex];
			// console.log(JSON.stringify(this.new_associations));
		},

		// if you click on a character, it gives it a new tag
		addNewAssociation(characterindex) {
			// console.log(characterindex);
			// let clicktime = this.$store.state.audioplayertime;
			// this.latest_text_character_array[
			// 	characterindex - this.deletedfrombeginningIndex.length
			// ].newtag = true;
			// this.new_associations[characterindex] = {Math.round(clicktime)};
			this.new_associations[characterindex] = {};

			// console.log(JSON.stringify(this.new_associations));
		},

		removeThisAssociationDrag(characterindex) {
			if (this.mouseHighlighting) {
				delete this.new_associations[characterindex];
			}
		},

		addNewAssociationDrag(characterindex) {
			if (this.mouseHighlighting) {
				this.new_associations[characterindex] = {};
			}
		},

		// addNewNullAssociation(characterindex) {
		// 	this.new_associations[characterindex] = null;
		// },

		async updateAssociationsfunc() {
			for (let prop in this.new_associations) {
				this.new_associations[prop][
					Math.round(
						((this.$store.state.startTimePrompter +
							this.$store.state.endTimePrompter) *
							100) /
						2
					)
				] = Math.round(
					((this.$store.state.endTimePrompter -
						this.$store.state.startTimePrompter) *
						100) /
					2
				);
			}

			if (this.$store.state.user) {
				// REFRESH ID TOKEN FIRST AND WAIT FOR IT
				await getIdToken(this.$store.state.user)
					.then((idToken) => {
						this.$store.commit("SetIdToken", idToken);
						// console.log(this.$store.state.idToken)
					})
					.catch((error) => {
						// An error happened.
						console.log("Oops. " + error.code + ": " + error.message);
					});
			}
			// console.log(
			//   JSON.stringify({
			//     text: this.latest_text, // Pass in a string that meets a minimum character count and includes all the new tags you want to save
			//     associations: this.new_associations, // Pass in the list of the new tags
			//   })
			// );
			// console.log(this.new_associations)
			// send new tags to the database
			fetch(
				process.env.VUE_APP_api_URL +
				"content/" +
				this.audio_id +
				"/" +
				this.interpretation_id,
				{
					method: "POST",
					body: JSON.stringify({
						text: this.latest_text.normalize("NFC"), // Pass in a string that meets a minimum character count and includes all the new tags you want to save
						associations: this.new_associations, // Pass in the list of the new tags
						editingversion: this.editingversion,
					}),

					headers: {
						"Content-Type": "application/json",

						Authorization: this.$store.state.idToken,
					},
				}
			)
				.then((response) => { return response.json() })
				.then((response) => {
					if (response.error == "not editing current version") {
						alert("This interpretation has been edited since you last loaded it; please refresh your page and try again.")
					} else {this.$emit("updateTitleLanguage", { "id": this.interpretation_id, "title": this.title, "language": this.language_name })}
				}

				)
				.then(() => {
					this.clearTimestamps();
					this.adulterateText();
				})
				.catch((error) => console.error("Error:", error));
		},
	},
};
</script>


<style scoped>
.tagger {
	-ms-overflow-style: none;
	/* for Internet Explorer, Edge */
	scrollbar-width: none;
	/* for Firefox */
	overflow-y: scroll;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-khtml-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
}

.tagger::-webkit-scrollbar {
	display: none;
	/* for Chrome, Safari, and Opera */
}
</style>
