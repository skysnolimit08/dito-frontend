// import Vue from 'vue'
import Vuex from 'vuex'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, } from "firebase/auth";


export default new Vuex.Store({
  state: {
    // It's like data, but for your store.
    user: null, // currently logged-in user
    selected: "",
    sidebar: false, // sidebar displayed or not
    playerRerender: "", // ID of audio file as it finishes uploading to AWS S3
    consoles: [], // array of ID's of interpretations for which there should be a viewer column currently displayed in the browser
    incomingCurrentTime: 0, // Viewer.vue can update this, and when it is updated, Player will start playing audio from this time
    audioplayertime: 0, // the current time of the audio player
    idToken: null, // the idToken of the currently logged-in user
    consoleswidth: 0,
    dashboardRerender: 0,
    showStorybookModal: "",
    showAddViewersModal: "",
    showIntCollabModal: "", // thisis shown to ownersofinterpretations when they manage the editors and viewers
    showIntViewersModal: "", // this is shown to editors of interpretations when they manage the viewers
    consolesheight: 0,

  },
  getters: {
    // it's like computed properties, but for your store.
    maxsize(state) {
      return state.consoleswidth / state.consoles.length / 12 - 3
    },
  },
  mutations: {
    //Can be tracked by Vue dev tools in (at least Chrome) browser.
    //Try to avoid using asynchronous code in here.  If you want to use one of these functions asynchronously, call it from actions.



    Logout_User(state) {
      state.user = null
    },

    Login_User(state, user) {

      state.user = user
    },

    SetIdToken(state, token) {
      state.idToken = token
    },

    ClearIDToken(state) {
      state.idToken = null
    },

    toggleSidebar(state, visibility) {
      state.sidebar = visibility;
    },

    
  updateSelected(state, selected) {
      state.selected = selected
    },

    updateIncomingCurrentTime(state, value) {
      state.incomingCurrentTime = value
    },

    updateAudioTime(state, audiotime) {
      state.audioplayertime = audiotime;
    },

    updateConsolesWidth(state, newwidth) {
      state.consoleswidth = newwidth
    },

    updateConsolesHeight(state, newheight) {
      state.consolesheight = newheight
    },

    addConsolesCount(state, interpretation_id) {
      state.consoles.push(interpretation_id)
    },

    deleteConsole(state, interpretation_id) {
      let index = state.consoles.indexOf(interpretation_id);
      console.log(state.consoles)
      console.log(state.index)

      if (index > -1) {
        state.consoles.splice(index, 1); // 2nd parameter means remove one item only
      }

      console.log(state.consoles)
    },

    clearConsoles(state) {
      state.consoles.length = 0
    },


    forcePlayerRerender(state, interpretation_id) {
      state.playerRerender = interpretation_id
    },

    forceDashboardRerender(state) {
      state.dashboardRerender++
    },

    
    showStorybookModal(state, audio_id) {
      state.showStorybookModal = audio_id
    },
    
    hideStorybookModal(state) {
      state.showStorybookModal = null
    },


    showAddViewersModal(state, audio_id) {
      state.showAddViewersModal = audio_id
    },
    
    hideAddViewersModal(state) {
      state.showAddViewersModal = null
    },

       
    showIntCollabModal(state, int_id) {
      state.showIntCollabModal = int_id
    },
    
    hideIntCollabModal(state) {
      state.showIntCollabModal = null
    },
       
    showIntViewersModal(state, int_id) {
      state.showIntViewersModal = int_id
    },
    
    hideIntViewersModal(state) {
      state.showIntViewersModal = null
    },
  },
  actions: {


    Login_User: (context, { email, password }) => {
      // const email2 = email
      // const password2 = password
      return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => { return userCredential })
        .then((data) => {
          // onAuthStateChanged listener will handle user assignment
          context.commit('Login_User', data.user)
        })
        .catch((error) => {
          console.log("Oops. " + error.code + ": " + error.message);
        });




    },

    Logout_User: (context) => {

      signOut(auth)
        // .then(() => {
        // onAuthStateChanged listener will handle user assignment
        // context.commit('Logout_User')
        // })
        .catch((error) => {
          // An error happened.
          console.log("Oops. " + error.code + ": " + error.message);
        });


    },

    Register_User: (context, { email, password, display_name, description, anonymous }) => {
      const register_email = email
      const register_password = password
      return createUserWithEmailAndPassword(auth, register_email, register_password)
        .then((userCredential) => { return userCredential })
        // .then((data) => {
          // onAuthStateChanged listener will handle user assignment
          // console.log(data)
          // context.commit('Login_User', {email, password})
        // })
        .then(
          // setTimeout(
            
          (data) => {
            fetch(process.env.VUE_APP_api_URL + "user/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: data.user.accessToken,
              },
              body: JSON.stringify({
                display_name: display_name,
                description: description,
                anonymous: anonymous,
                email: email,
              }),
            })
              .then((response) => response.json())
              .then((response) => console.log(response))
              .catch(function (error) {
                console.log("Oops. " + error.code + ": " + error.message);
              });
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Oops. " + error.code + ": " + error.message);
          }
          
          
            
            // , 2000)
          
        );



    },

  },
  modules: {
  }
})
