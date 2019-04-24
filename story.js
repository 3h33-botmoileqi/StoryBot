class Story {
	constructor(chatElement){
		this.name = "New Story"
		this.config = {
			"adsEachMessages": -1,
			"displaycharacterName":true,
			"displaycharacterAvatar":true,
			"displayMessageDate":true,
			"customCSS":""
		};
		this.characters = {};
		this.conversation = [];
		this.messagesGroup = [];
		this.chatElement = $('#chat');
		this.tapeRequiredFlag = false;
		this.currentMessagesGroup = null;
		this.lastCharacter = null;
		this.id =0;
		this.resumeId = 0;
		this.editor = false;
    	this.cssSheet = document.createElement('style');
    	this.cssSheet.type = "text/css";
    	document.body.appendChild(this.cssSheet);
 		this.config.customCSS = 
 		`/*Toutes les en-tetes*/
.messagesGroup-header{
  
}
/*En-tetes gauche*/
.header-left{
  
}
/*Avatar*/
.header-left .avatar{
  
}
/*Nom personnage*/
.header-left h6{
  
}

/*En-tetes droite*/
.header-right{
  
}
/*Avatar*/
.header-right .avatar{
  
}
/*Nom personnage*/
.header-right h6{
  
}

/*Toutes les blocs messages*/
.message .message-container{
  
}

/*Bloc message Gauche*/
.message-left .message-container{
  
}

/*Bloc message droit*/
.message-right .message-container{
  
}
/*Arrière plans */
#chatPanel, #example{

}`;
		//this.loadDemo();
	}

	contructor(story, chatElement){

		generateMessagesGroup();
	}

	log(){
		console.log(this);
	}

	waitFor(initialState, delay, callback) {
	    return new Promise((resolve,reject) => {
	      setTimeout(() => {
	      	if(initialState == this.editor){
	      		callback();
	        	resolve('delayed');
	      	}
	      }, delay);
	    }).catch(err => console.log(err));
	  }

	async playStory(id = 0){
		this.id = id;
		if(this.conversation.length){
			this.generateMessagesGroup();
		    while(this.id < this.conversation.length && (!this.tapeRequiredFlag || this.editor)){
				if(this.conversation[this.id].tapeFlag && !this.editor && this.id >= this.resumeId){
					this.tapeRequiredFlag = true;
					$("#tapeLogo").show();
				}else{
					await this.waitFor(this.editor, this.editor || this.id < this.resumeId ? 0 : this.conversation[this.id].delay, ()=>{this.StoryNextMessage()});
				}
		    }
		}
	    //Si la story est fini sinon attend un touch
	    /*
	    if(this.id >= this.conversation.length)
	      console.log('Done!');
	    */
	}

	StoryNextMessage(OnTape = false){
		try{
			this.currentMessagesGroup = $("#chat .messagesGroup").length ? $("#chat .messagesGroup").last() : null;
			if(this.currentMessagesGroup == null || this.conversation[this.id].character !== this.lastCharacter){
				this.lastCharacter = this.conversation[this.id].character;
				this.currentMessagesGroup = this.MessageGroupDom(this.conversation[this.id].side, this.lastCharacter)
				$(this.chatElement).append(this.currentMessagesGroup);
			}
			let message = this.conversation[this.id].toDOM(this.config.displayMessageDate);
			this.insertMessageElement(message, $(this.currentMessagesGroup).children("ul"));
			if(this.conversation[this.id].animations){
				for(let animation of this.conversation[this.id].animations){
					$(message).animate(animation.properties, animation.duration, animation.easing);
				}
			}
			//$("#chatPanel").scrollTop($("#chatPanel").prop('scrollHeight'));
			var page = $(this).attr('href'); // Page cible
			var speed = 400; // Durée de l'animation (en ms)
			$("#chatPanel").animate( { width: "ease-out",scrollTop: $("#chatPanel").prop('scrollHeight') }, speed ); // Go
			this.id++;
			if(OnTape){
				this.tapeRequiredFlag = false;
				this.playStory(this.id);
			}
		}
		catch(err){
			console.log(err);
		}
	}

	/******************* Character Management ***********************/

	DeleteCharacter(characterName){
    	delete this.characters[characterName]
	}

	/******************* MESSAGE DOM Management**********************/

	MessageGroupDom(side, lastCharacter){
		let GroupDom =  $(`
			<li class="messagesGroup">
    			<div class="messagesGroup-header header-${side}">
    				<div>
    					${this.config.displaycharacterAvatar ? `<img class="avatar" src="${this.characters[lastCharacter].avatar}"/>` : ""}
    					${this.config.displaycharacterName ? `<h6>${lastCharacter}</h6>` : ""}
    				</div>
    			</div>
    			<ul></ul>
	        </li>`);
		GroupDom.find(".messagesGroup-header").click(function(){editor.loadCharacterModal(lastCharacter)})
		return GroupDom;
	}

	loadCharacterModal(characterName){
		$('#characterModal .avatar').attr('src', this.characters[characterName].avatar);
		if(this.characters[characterName].video){
			$('#characterModal #characterVideo').show();
			$('#characterModal #characterVideo').attr('src', this.characters[characterName].video);}
		else
			$('#characterModal #characterVideo').hide();
		if(this.characters[characterName].description){
			$('#characterModal #description').text(this.characters[characterName].description);
		}else{
			$('#characterModal #description').text("");
		}
		$('#characterModal #characterName').text(characterName);
		$('#characterModal').modal('toggle');
	}

	GetIdByMessageElement(element){
		return $(element).index('#chat .message');
	}

	GetMessageElementById(id){
		return $($(`#chat .message`).get(id));
	}

	insertMessageElement(message, parent,id=null){
		if(!id){
	        $(parent).append(message);
		}else{

		}
	}

	/*EditMessageElement(message, newMessage){
		let newMessageElement = $(newMessage.toDOM());
		$(message).replaceWith(newMessageElement);
    	this.conversation.splice(this.GetIdByMessageElement(message), 1, newMessage);
	}*/

	DeleteMessageElement(id){
		let message = this.GetMessageElementById(id);
		let messagesGroupList = $(message).parent();
		if($(messagesGroupList).children().length == 1){
			$(messagesGroupList.parent()).remove();
		}
		else{
			$(message).remove();
		}
    	this.conversation.splice(id, 1);
	}

	onMessageInput(id, text){
		this.conversation[id].text = text;
		this.GetMessageElementById(id).replaceWith(this.conversation[id].toDOM(this.config.displayMessageDate));
	}


	generateMessagesGroup(){
		this.messagesGroup = [];
		var lastCharacter = this.conversation[0].character;
		var currentPoll = [];
		for (var i = 0; i < this.conversation.length; i++) {
			if(lastCharacter === this.conversation[i].character){
				currentPoll.push(i);
			}else{
				this.messagesGroup.push(currentPoll);
				currentPoll = [i];
				lastCharacter = this.conversation[i].character;
			}
		}
		this.messagesGroup.push(currentPoll);
	}

	/*********************************************************/

	loadDemo(){
		this.name="Demo";
		this.characters = {"Personnage1":{"avatar":"https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48","defaultSide":"left"},"Personnage2":{"avatar":"https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg","defaultSide":"right"},"Personnage3":{"avatar":"https://yt3.ggpht.com/a-/AN66SAyjHOM6XYXi_WmTK5F3GJ0pu3G5nQg1gVS4aA=s48-c-k-c0xffffffff-no-rj-mo","defaultSide":"left"}}
		var conversation = [{"character":"Personnage1","timestamp":1521374361,"text":"Bonjour !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Hey, comment ça va ?","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage1","timestamp":1521374361,"text":"Très bien ! Regarde mon nouveau Poster !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage1","timestamp":1521374361,"text":"","payload":{"type":"image","url":"https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"},"delay":2000,"tapeFlag":false, "side":"left"},{"character":"Personnage3","timestamp":1521374361,"text":"C'est ma photo !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Bravo vous deux !","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage2","timestamp":1521374361,"text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.","payload":{},"delay":0,"tapeFlag":false, "side":"right"}];
		for(var message of conversation){
			this.conversation.push(new Message(message.character, message.side, message.text, message.payload, message.timestamp, message.delay, message.tapeFlag, false))
		}
		this.generateMessagesGroup();
		var css = 
		`/*.message-container{
	-webkit-animation: swirl-in-fwd 0.6s ease-out both;
	animation: swirl-in-fwd 0.6s ease-out both;
}

@-webkit-keyframes swirl-in-fwd {
  0% {
    -webkit-transform: rotate(-540deg) scale(0);
            transform: rotate(-540deg) scale(0);
    opacity: 0;
  }
  100% {
    -webkit-transform: rotate(0) scale(1);
            transform: rotate(0) scale(1);
    opacity: 1;
  }
}
@keyframes swirl-in-fwd {
  0% {
    -webkit-transform: rotate(-540deg) scale(0);
            transform: rotate(-540deg) scale(0);
    opacity: 0;
  }
  100% {
    -webkit-transform: rotate(0) scale(1);
            transform: rotate(0) scale(1);
    opacity: 1;
  }
}
.message .message-container{
  box-shadow:0px 5px 5px rgba(0, 0, 0, 0.3);
}
.message-left .message-container{
  background:#bdb4fe;
  color:#000000
}
.message-right .message-container{
  background:#fdaaac;
  color:#000000
}
#chat{
  background:white
}*/`;
		this.loadCSS(css);
		//this.log();
	}

	loadCSS(css){
		console.log("load css");
		this.config["customCSS"] = css;
		this.cssSheet.innerHTML = this.config["customCSS"];
	}
}

class Message{
	constructor(characterName, side, text, payload, timestamp, delay, tapeFlag, ads){
		this.character = characterName;
		this.text = text;
		this.payload = payload;
		this.timestamp = timestamp;
		this.delay = delay;
		this.tapeFlag = tapeFlag;
		this.side = side;
		this.ads = ads;
	}

	AddAnimations(animArray){
		try{
			var json;
			if(typeof animArray == 'string')
				this.animations = JSON.parse(animArray);
			else
				this.animations = animArray;
		}
		catch(err){
			console.log(err);
		}
	}

	changeText(text){
		this.text = text;
	}

	toDOM(displayMessageDate = true){
		let message = $(`<li class="message message-${this.side}">
					<div class="message-container">
						<div class="${this.text ? "text" : this.payload.type}" ${this.text ? 'contenteditable="false"' : ""}>${this.loadContent()}</div>
						${displayMessageDate ? `<div class="Date">${this.GetTime()}</div>` : ""}
					</div>
				</li>`);
		return message;
	}

	GetTime() {
		var date = new Date(this.timestamp*1000);
	    var hours = date.getHours();
	    var minutes = date.getMinutes();
	    /*var ampm = hours >= 12 ? 'PM' : 'AM';
	    hours = hours % 12;
	    hours = hours ? hours : 12; // the hour '0' should be '12'*/
	    minutes = minutes < 10 ? '0'+minutes : minutes;
	    var strTime = hours + ':' + minutes;// + ' ' + ampm;
	    return strTime;
	}   

	loadContent(){
		if(this.text !== "")
			return this.text;
		else{
			switch(this.payload.type){
                case "image":
                    return '<img src="'+ this.payload.url+'"/>';
                    break;
                case "video":
                    if(this.payload.url.search("youtube")){
                        return '<iframe width="560" height="315" src="'+this.payload.url.replace("watch?v=", "embed/")+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
                    }
                    else{
                        return '<video controls autoplay muted>'+
                                  '<source src="'+this.payload.url+'" type="video/mp4">'+
                                  'Your browser does not support the video tag.'+
                                '</video>';
                    }
                    break;
                case "audio" :
                    return '<audio controls><source src="'+this.payload.url+'" type="audio/mpeg">Your browser does not support the audio element.</audio>';
                    break;
                default:
                	return "";
            }
		}
	}
}

/*class Character{
	contructor(characterName, avatarUrl, defaultSide){
		this.characterName = characterName;
		this.avatarUrl = (avatarUrl === "" ? "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png" : avatarUrl);
		this.defaultSide = defaultSide;
	}
}*/

class Editor extends Story{
	constructor(){
		super();
		this.editor = true;
		this.storyRef = null;
		this.authors = [];
		this.loadEditor();
	}

	//Start Story
	StartStoryEditor(){
		$("#chat").empty();
		this.playStory();
	}

	//load story from DB
	loadStory(ref, story){
		this.storyRef = ref;
		this.authors = story.authors;
		this.name = story.name;
		this.config = story.config;
		this.characters = story.characters;
		this.conversation = [];
		for(let message of story.conversation){
			this.conversation.push(new Message(message.character, message.side, message.text, message.payload, message.timestamp, message.delay, message.tapeFlag, false));
			if(message.animations)
				this.conversation[this.conversation.length-1].AddAnimations(message.animations);
		}
		if(this.editor)
			this.loadEditor();
	}

	loadEditor(){
		this.loadAuthors();
		this.loadMessages();
		this.loadCharacters();
	}

	authorItemDom(author){
		var authorItem = $(`
			<li class="list-group-item d-flex align-items-center author">
				<div class="flex-grow-1 text">${author}</div>
				<button class="btn btn-secondary authorDelete"><i class="fas fa-times"></i></button>
			</li>`);
	    $(authorItem).find('.authorDelete').click(function(){editor.DeleteAuthor(author)});
		return authorItem;
	}

	loadAuthors(){
		$("#authorsList").empty();
		for(var author of this.authors){
			let authorItem = this.authorItemDom(author.id);
			$("#authorsList").append(authorItem);
		}
	}

	AddAuthor(author){
		if(validateEmail(author)){
			if(this.authors.findIndex(ref => ref.id === author) == -1){
		        db.collection('users').doc(author).get().then(doc => {
		            if (!doc.exists) {
		            	console.log("new user");
		                db.collection("users").doc(author).set({}).then(doc =>{
							this.authors.push(doc.ref);
							let authorItem = this.authorItemDom(doc.id);
							$("#authorsList").append(authorItem);
							if(this.storyRef){
								db.collection("stories").doc(this.storyRef).update({
									authors: this.authors
								});
							}
		                });
		            }else{
						this.authors.push(doc.ref);
						let authorItem = this.authorItemDom(doc.id);
						$("#authorsList").append(authorItem);
						if(this.storyRef){
							db.collection("stories").doc(this.storyRef).update({
								authors: this.authors
							});
						}
		            }
		        })
		        .catch(err => {
		            console.log('Error getting document', err);
		        });
			}else{
	        	alert("Cette personne est déjà un auteur de la story");
			}
	    }else{
	        alert("email invalide");
	    }
	}

	DeleteAuthor(author){
		if(login != author){
			let id = this.authors.findIndex(ref => ref.id === author);
			this.authors.splice(id, 1);
			$(`.author:nth-child(${id+1})`).remove();
			db.collection("stories").doc(this.storyRef).update({
				authors: this.authors
			});
		}else{
			alert("Vous ne pouvez pas vous supprimer l'accès a votre propre story.");
		}
	}

	loadCharacters(){
		var editorRef = this;
		 $(".characterList").each(function(indexList, list){
			$(list).empty();
			$.each(editorRef.characters,function(characterName, character){
				if($(list).is("#mainCharacterList")){
					let characterItem = editorRef.characterItemDom(characterName);
					$(list).append(characterItem);
				}else{
					$(list).append(`<option value="${characterName}">${characterName}</option>`);
				}
			});
		})
	}

	characterItemDom(characterName){
		let characterItem = $(
			`<li id="character-${characterName}" class="list-group-item d-flex align-items-center">
				<img class="avatar" src="${this.characters[characterName].avatar}"/>
				<div class="flex-grow-1 text">${characterName}</div>
				<div class="btn-group tools">
					<button class="btn btn-secondary characterEdit"><i class="fas fa-user-edit"></i></button>
					<button class="btn btn-secondary characterDelete"><i class="fas fa-times"></i></button>
				</div>
			</li>`);
	    $(characterItem).find('.characterEdit').click(function(){editor.LoadSelectedCharacter(characterName);});
	    $(characterItem).find('.characterDelete').click(function(){editor.DeleteCharacterEditor(characterName)});
	    return characterItem;
	}

	characterFormSubmit(){
		let charaForm = document.forms["characterForm"];
		let isNew = charaForm["isNew"].value;
		let characterNameOld = charaForm["characterName"].value;
		let characterName = charaForm["name"].value;
		let characterAvatar = charaForm["avatar"].value ? charaForm["avatar"].value : "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png";
		let characterVideo = charaForm["video"].value ? charaForm["video"].value : "";
		let charDesc = $(quillCharDesc.root.innerHTML).html() ? $(quillCharDesc.root.innerHTML).html() : ""
		let character = {avatar: characterAvatar, video:characterVideo, description:charDesc, defaultSide: charaForm["defaultSide"].value}
		if(isNew === "true"){
			this.insertCharacterEditor(character, characterName);
		}
		else{
			this.editCharacterEditor(character, characterName, characterNameOld);
		}
		$(".characterFormContainer").hide();
		$(".characterListContainer").show();
	}

	insertCharacterEditor(character, characterName){
		this.characters[characterName] = character;
		this.loadCharacters();
	}

	editCharacterEditor(character, characterName, characterNameOld){
		if(characterName !== characterNameOld){	
			this.DeleteCharacter(characterNameOld);
		}
		this.characters[characterName] = character;
		 $(".characterList").each(function(indexList, list){
			if($(list).is("#mainCharacterList")){
				//Delete LI
				$(list).find(`li#character-${characterNameOld}`).replaceWith(editor.characterItemDom(characterName));
			}
			else{
				//Delete option
				$(list).find(`option[value="${characterNameOld}"]`).replaceWith(`<option value="${characterName}">${characterName}</option>`);;
			}
		});
		$(".messagesGroup-header").each(function(index, element){
			if($(this).find("h6").text() == characterNameOld){
				$(this).find("h6").text(characterName);
				$(this).find("img").attr("src", editor.characters[characterName].avatar);
			}
		});
	}

	DeleteCharacterEditor(characterName){
		for (var i = 0; i <this.conversation.length ; i++) {
			if(this.conversation[i].character == characterName){
				this.DeleteMessageEditor(i);
				i--
			}
		}
		this.DeleteCharacter(characterName);
		 $(".characterList").each(function(indexList, list){
			if($(list).is("#mainCharacterList")){
				//Delete LI
				$(list).find(`li#character-${characterName}`).remove();
			}
			else{
				//Delete option
				$(list).find(`option[value="${characterName}"]`).remove();
			}
		});
	}

	LoadSelectedCharacter(characterName, isNew = false){
		$(".page").hide();
		$(".characterFormContainer").show();

		let charaForm = document.forms["characterForm"];
		charaForm["characterName"].value = characterName;
		charaForm["isNew"].value = isNew;
		let chara = this.characters[characterName];
		charaForm["name"].value = "";
		charaForm["avatar"].value = "";
		charaForm["video"].value = "";
		quillCharDesc.root.innerHTML = "";
		charaForm["defaultSide"].value = "";
		if(!isNew){
				charaForm["name"].value = characterName;
				charaForm["avatar"].value = chara.avatar;
				charaForm["video"].value = chara.video ? chara.video : "";
				quillCharDesc.root.innerHTML = chara.description;
				charaForm["defaultSide"].value = chara.defaultSide;
		}
	}

	loadMessages(){
		$("#messageList").empty();
		for (var i = 0; i < this.conversation.length; i++) {
			let messageItem = this.messageItemDom(this.conversation[i], i);
			$("#messageList").append(messageItem);
		}
		let quickMessageForm = $(
			`<li class="list-group-item">
				<form id="quickMessageForm" name="quickMessageForm" class="form-inline" onsubmit="editor.quickMessageFormSubmit();return false;">
					<select class="form-control characterList" name="character" required></select>
					<input type="text" id="quickText" name="text" hidden>
					<div id="editableQuickText" class="flex-grow-1 text" contenteditable="true" oninput="quickText.value = this.innerHTML;" style="outline: -webkit-focus-ring-color auto 5px;"></div>
					<button type="submit" class="btn btn-dark"><i class="fas fa-plus"></i></button>
				</form>
			</li>`);
		$("#messageList").append(quickMessageForm);
		this.MessagelistScrollDown();
	}

	MessagelistScrollDown(){
		$("#messageList").animate( { width: "ease-out",scrollTop: $("#messageList").prop('scrollHeight') }, 750 ); // Go
	}

	GetIdByMessageListElement(element){
		return $(element).index('#messageList>.messageItem');
	}

	GetMessageListElementById(id){
		return $($(`#messageList>.messageItem`).get(id));
	}

	messageItemDom(message, index){
		let messageItem = $(
			`<li class="list-group-item d-flex align-items-center messageItem">
				<img class="avatar" src="${this.characters[message.character].avatar}"/>
				<div class="flex-grow-1 text" contenteditable="true">${message.text ? message.text : (message.payload.type ? message.payload.type : "")}</div>
				<div class="btn-group tools">
					<button class="btn btn-secondary messageView"><i class="fas fa-eye"></i></button>
					<button class="btn btn-secondary messageEdit"><i class="fas fa-edit"></i></button>
					<button class="btn btn-secondary messageDelete"><i class="fas fa-times"></i></button>
					<button class="btn btn-secondary messageUp"><i class="fas fa-arrow-up"></i></button>
					<button class="btn btn-secondary messageDown"><i class="fas fa-arrow-down"></i></button>
				</div>
			</li>`);
	    $(messageItem).find('.messageView').click(function(){editor.changeViewMode(true, editor.GetIdByMessageListElement(messageItem));editor.changePanel('#chatPanel');});
	    $(messageItem).find('.messageEdit').click(function(){editor.LoadSelectedMessage(index);});
	    $(messageItem).find('.messageDelete').click(function(){editor.DeleteMessageEditor(index)});
	    $(messageItem).find('.messageUp').click(function(){editor.MoveSelectedMessage(editor.GetIdByMessageListElement(messageItem), -1);});
	    $(messageItem).find('.messageDown').click(function(){editor.MoveSelectedMessage(editor.GetIdByMessageListElement(messageItem), 1)});
        $(messageItem).find('.text').on('input',function(){editor.onMessageInput(editor.GetIdByMessageListElement(messageItem), $(this).text());});
	    return messageItem;
	}

	MoveSelectedMessage(currentId, move){
		if(currentId+move >= 0 && currentId+move < this.conversation.length){
			var target = $(`#messageList>li:nth-child(${(currentId+move)+1})`);
			if(move > 0){
				target.after($(this.GetMessageListElementById(currentId)).detach());
			}else{
				target.before($(this.GetMessageListElementById(currentId)).detach());
			}
			this.conversation.splice((currentId+move),0 ,this.conversation.splice(currentId,1)[0]);
		}
	}

	quickMessageFormSubmit(){
		let msgForm = document.forms["quickMessageForm"];
		let text = msgForm["text"].value;
		let message = new Message(
			msgForm["character"].value,
			this.characters[msgForm["character"].value].defaultSide,
			text,
			{},
			new Date().getTime() /1000,
			0,
			true,
			false
			);
		this.insertMessageEditor(this.conversation.length, message);
		msgForm["text"].value = "";
		$("#editableQuickText").text("");
		this.MessagelistScrollDown();
	}

	messageFormSubmit(){
		let msgForm = document.forms["messageForm"];
		let isNew = msgForm["isNew"].value;
		let id = msgForm["messageId"].value;
		let message = new Message(
			msgForm["character"].value,
			msgForm["side"].value,
			$(quill.root.innerHTML).html(),
			{type:msgForm["payload-type"].value, url:msgForm["payload-url"].value},
			new Date($('#datetimepicker1').datetimepicker('viewDate')).getTime() /1000,
			msgForm["delay"].value * 1000,
			msgForm["tapeFlag"].checked,
			msgForm["adsFlag"].value
			);
		if(CodeMirrorAnimations.getValue() !== ""){
			message.AddAnimations(CodeMirrorAnimations.getValue());
		}
		if(isNew === "true"){
			this.insertMessageEditor(id, message);	
		}else{
			this.editMessageEditor(id, message);
		}

		$(".messageFormContainer").hide();
		$(".messageListContainer").show();
		this.MessagelistScrollDown();
	}
	insertMessageEditor(id, message){
		$("#messageList>li").last().before(this.messageItemDom(message, id));
		this.conversation.splice(id,0 ,message);
	}

	editMessageEditor(id, message){
		this.conversation.splice(id, 1, message);
		this.GetMessageListElementById(id).replaceWith(this.messageItemDom(message, id));
	}

	DeleteMessageEditor(id){
		this.conversation.splice(id, 1);
		this.GetMessageListElementById(id).remove();
	}

	LoadSelectedMessage(id, isNew = false){
		$(".messageListContainer").hide();
		$(".messageFormContainer").show();
		CodeMirrorAnimations.refresh();

		let msgForm = document.forms["messageForm"];
		msgForm["messageId"].value = id;
		msgForm["isNew"].value = isNew;
		//INIT FORM
		msgForm["character"].value = "";
		msgForm["content"].value = "text";
		$('#textPayload').show();
		$('#mediaPayload').hide();
		msgForm["payload-type"].value = "";
		msgForm["payload-url"].value= "";
		quill.root.innerHTML = "";
		$('#datetimepicker1').datetimepicker('date', new Date());
		msgForm["delay"].value = 0;
		msgForm["tapeFlag"].checked = true;
		msgForm["adsFlag"].checked = false;
		if(!isNew){
			let msg = this.conversation[id];
			msgForm["character"].value = msg.character;
			msgForm["side"].value = msg.side;
			if(msg.text !== ""){

				msgForm["content"].value = "text"; 
				quill.root.innerHTML = msg.text;
			}
			else{
				$('#textPayload').hide();
				$('#mediaPayload').show();

				msgForm["content"].value = "media"; 
				msgForm["payload-type"].value = msg.payload.type;
				msgForm["payload-url"].value = msg.payload.url;
			}
			$('#datetimepicker1').datetimepicker('date',moment(msg.timestamp*1000));
			msgForm["delay"].value = msg.delay/1000;
			$("#delayOutput").text(msgForm["delay"].value+" sec");
			msgForm["tapeFlag"].checked = msg.tapeFlag;
			msgForm["adsFlag"].checked = msg.ads;
			if(msg.animations)
				CodeMirrorAnimations.setValue(msg.animations ? JSON.stringify(msg.animations, null, 2) : "");
		}
	}

	configFormSubmit(){
		let configForm = document.forms["configForm"];
		this.name = configForm['storyName'].value;
		this.config.displaycharacterName = configForm['displaycharacterName'].checked
		this.config.displaycharacterAvatar = configForm['displaycharacterAvatar'].checked
		this.config.displayMessageDate = configForm['displayMessageDate'].checked
		if(configForm['adsFlag'].value == true)
			this.config.adsEachMessage = configForm['adsEachMessages'].value
		else
			this.config.adsEachMessage = 0;
	}

	loadConfig(){
		let configForm = document.forms["configForm"];
		configForm['storyName'].value = this.name;
		configForm['displaycharacterName'].checked = this.config.displaycharacterName;
		configForm['displaycharacterAvatar'].checked = this.config.displaycharacterAvatar;
		configForm['displayMessageDate'].checked = this.config.displayMessageDate;
		if(this.config.adsEachMessage>0){
			$('#adsConfig').show();
			configForm['adsFlag'].checked = true;
			configForm['adsEachMessages'].value = this.config.adsEachMessage;
		}
		else{
			$('#adsConfig').hide();
		}
	}

	changePanel(elementId){
		$('.buttonPage').removeClass('active');
		$(this).addClass('active');
		$('.page').hide();
		$(elementId).show();
	}

	changeViewMode(previsual, resumeId = -1){//False = user / true = editor
		this.resumeId = resumeId;
		//this.editor = mode;
		if(previsual === false){
			$("#viewMode").prop("checked", false);
			this.editor=true;
			if(this.tapeRequiredFlag){
				this.tapeRequiredFlag = false;
				$("#tapeLogo").hide();
			}
		}else if(previsual === true){
			$("#viewMode").prop("checked", true);
			this.editor=false;
		}
		else{
			console.error("mode unknow");
		}
		this.StartStoryEditor();
	}
}