var CodeMirror = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
  mode:  "css",
  lineNumbers: true,
  autofocus: true,
  autoCloseBrackets: true,
  colorpicker : {
      mode : 'edit'
  },
});

var quill = new Quill('#message-editor', {
	theme: 'snow'
});

$(function () {
	$('#datetimepicker1').datetimepicker({date:new Date, locale: 'fr', icons:{time:"fa fa-clock", date:"fa fa-calendar-alt"}});
});

let editor;
$(document).ready(function () {//Height adjust
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }); 
	editor = new Editor();

    //link css editor with custom css
    CodeMirror.setValue(editor.config['customCSS']);
    CodeMirror.on("change", function(cm){
        editor.loadCSS(cm.getValue());
    });
	editor.playStory();
});
/****************** Date Management ***************************/
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
let login = null;
function loginFormSubmit(){
    login = document.forms["loginForm"]["login"].value.toLowerCase();
    if(validateEmail(login)){
        db.collection('users').doc(login).get().then(doc => {
            if (!doc.exists) {
                console.log('New User');
                db.collection("users").doc(login).set({});
            }
            editor.changePanel("#cloudPanel");
            loadStories(login);
        })
        .catch(err => {
            console.log('Error getting document', err);
        })
    }else{
        alert("email invalide");
    }
}
function loadStories(login){
    $("#storiesList").empty();
    var docRef = db.collection("users").doc(login);
    db.collection("stories").where('author', '==', docRef).get().then(snapshot => {
        if (snapshot.empty) {
          $("#storiesList").append(`
            <li class="list-group-item d-flex align-items-center">
                    <div class="flex-grow-1 text">Aucune Story retrouvée</div>
            </li>`);
          return;
        }
        snapshot.forEach(doc => {   
            var storyItem = $(`
                <li class="list-group-item d-flex align-items-center">
                    <div class="flex-grow-1 text">${doc.data().name}</div>
                    <div class="btn-group">
                        <button class="btn btn-secondary storyLoad" onclick="loadStory('${doc.id}')"><i class="fas fa-edit"></i></button>
                    </div>
                </li>`);
            $("#storiesList").append(storyItem);
        });
    })
  .catch(err => {
    console.log('Error getting documents', err);
  });
}

function loadStory(storyRef){
    var answer = confirm("Vous êtes sur le point de "+( storyRef == null ? "créer une nouvelle story." : "charger une autre story.")+ " Souhaitez vous sauvegarder votre story actuel ?")
    if(answer){
        saveStory(login);
    }
    if(storyRef !== null){
        db.collection('stories').doc(storyRef).get().then((doc) => {
            editor.loadStory(storyRef, doc.data());
            alert("Story chargée avec succès");
            editor.changePanel("#chatPanel");
            editor.StartStoryEditor();
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
    else{
        editor = new Editor();
        editor.changePanel("#chatPanel");
        editor.StartStoryEditor();
    }
}

function saveStory(login){
    var docRef = db.collection("users").doc(login);
    if(editor.storyRef !== null){
        db.collection("stories").doc(editor.storyRef).update({
            author: docRef,
            name: editor.name,
            config: editor.config,
            characters: editor.characters,
            conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
        });
  }
  else{
    editor.storyRef = db.collection("stories").add({
        author: docRef,
        name: editor.name,
        config: editor.config,
        characters: editor.characters,
        conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
    });
    loadStories(login);
  }
}

/**************************************************************/