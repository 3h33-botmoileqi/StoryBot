$(document).ready(function (){
  ui = new firebaseui.auth.AuthUI(firebase.auth());

  var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        console.log(authResult);
        if(authResult.user.metadata.a == authResult.user.metadata.b){
          console.log("new user");
          db.collection("users").doc(authResult.user.uid).set({email:authResult.user.email});
        }
        changePanel("#authorPanel");
        return false;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    //signInFlow: 'popup',
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>',
    // Privacy policy url.
    privacyPolicyUrl: '<your-privacy-policy-url>'
  };

  loadPublishedStory();
  
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      console.log("logged as "+user.email);

      loadStories(user.uid);
      changePanel("#authorPanel");
      $(".signInItem").hide();
      $("#navbarDropdownMenuLink").text(user.email)
      $(".logedItem").show();
    } else {
      console.log("not connected");
      ui.start('#firebaseui-auth-container', uiConfig);
      $(".signInItem").show();
      //changePanel($('#signInItem').get(0), "#loginPage");
    }
  });
});


function loadStories(login){
  $("#storiesList").empty();
  db.collection("users").doc(login).get().then(doc =>{
    db.collection("stories").where('authors', 'array-contains', doc.id).get().then(snapshot => {
        if (snapshot.empty) {
          $("#storiesList").append(`
            <li class="list-group-item d-flex align-items-center">
                    <div class="flex-grow-1 text">Aucune réalisation trouvées, crée une nouvelle story en cliquant sur <button class="btn-dark"><i class="fas fa-plus"></i></button> à droite</div>
            </li>`);
          return;
        }
        snapshot.forEach(doc => {
            //dom Element
            var storyItem = $(`
                <li id="${doc.id}" class="list-group-item d-flex align-items-center story">
                    <div class="flex-grow-1 text">${doc.data().name}</div>
                    <div>
                        <a href="editor?id=${doc.id}"><button class="btn btn-secondary storyLoad"><i class="fas fa-edit" style="color:white"></i></button></a>
                        <button class="btn btn-secondary storyDelete" onclick="deleteStory('${doc.id}')"><i class="fas fa-times"></i></button>
                    </div>
                </li>`);
            //Load Event
            storyItem.find(".storyLoad").click(function(){
                //loadStoryConfirm(doc.id);
                //LOAD
            });
            //DeleteEvent
            storyItem.find(".storyDelete").click(function(){
                //deleteStory(doc.id);
                //DELETE
            });
            //Add to Dom
            $("#storiesList").append(storyItem);
        });
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
  })
}

function createNewStory(){
  db.collection("stories").add({
      authors: [firebase.auth().currentUser.uid],
      name: "New Story",
      config: {
  			"adsEachMessages": -1,
  			"displaycharacterName":true,
  			"displaycharacterAvatar":true,
  			"displayMessageDate":true,
  			"customCSS":""
  		},
      characters: {},
      conversation: []
  }).then(doc => {
    //Redirect to editor with new id
    window.location.replace("http://storybot/editor?id="+doc.id);
  })
  .catch(err => {
      console.log('Error adding document', err);
  })
}

var storiesPerRow = 4;//Must be X % 2 = 0
var gridSize = 12 / storiesPerRow;
function loadPublishedStory(){
  db.collection("stories").where("config.isPublished", "==", true).get().then(querySnapshot => {
    if(querySnapshot.empty){
      console.log("aucun stories disponible");
    }else{
      var i = 0;
      var library = $('<div class="storyList"></div>');
      for (var y = 0; i < 16 ; y++) {
        var row = $('<div class="row"></div>');
        for (var x = 0; x < storiesPerRow && i < 24; x++) {
          //var doc = querySnapshot.docs[i].data();
          var card = $(`<div class="storyCard col-lg-${gridSize}"><img src="https://via.placeholder.com/${parseInt(($("#content").width()-50)/storiesPerRow)}x200"><h5>${"Placeholder"}</h5></div>`);
          card.click(function(){window.location.replace("./story?id=k0MlF1wZlPP8ewu2EEDb")});
          $(row).append(card);
          i++;
        }
        $(library).append(row);
      }
      $("#storePage").append(library);
    }
  })
}
