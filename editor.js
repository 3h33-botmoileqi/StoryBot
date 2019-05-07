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
		this.tapeRequiredFlag = false;
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

	//Load editor (messages/Character)
	loadEditor(){
		this.loadAuthors();
		this.loadMessages();
		this.loadCharacters();
	}

//## region Authors
	authorItemDom(author, id){
		var authorItem = $(`
			<li class="list-group-item d-flex align-items-center author">
				<div class="flex-grow-1 text">${author}</div>
				<button class="btn btn-secondary authorDelete"><i class="fas fa-times"></i></button>
			</li>`);
	    $(authorItem).find('.authorDelete').click(function(){editor.DeleteAuthor(id)});
		return authorItem;
	}

	loadAuthors(){
		$("#authorsList").empty();
		for(var author of this.authors){
			db.collection("users").doc(author).get().then(doc =>{
				let authorItem = this.authorItemDom(doc.data().email, doc.id);
				$("#authorsList").append(authorItem);
			})
		}
	}

	validateEmail(email) {
	    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(String(email).toLowerCase());
	}

	AddAuthor(author){
	if(this.validateEmail(author)){
		db.collection('users').where("email", "==", author).get().then(snapshot => {
			if(!snapshot.empty){
				if(snapshot.docs.length == 1){
					var doc = snapshot.docs[0];
					if(this.authors.findIndex(ref => ref.id === doc.id) == -1){
						this.authors.push(doc.id);
						let authorItem = this.authorItemDom(author, doc.id);
						$("#authorsList").append(authorItem);
						if(this.storyRef){
							db.collection("stories").doc(this.storyRef).update({
								authors: this.authors
							});
						}
					}
					else{
						alert("Cette personne est déjà un auteur de la story");
					}
				}
			}else{
			alert("Utilisateur introuvable");
			}
		})
	}
	else{
		alert("email invalide");
	}
}

	DeleteAuthor(authorId){
		if(firebase.auth().currentUser.uid != authorId){
			let id = this.authors.findIndex(ref => ref	 === authorId);
			this.authors.splice(id, 1);
			$(`.author:nth-child(${id+1})`).remove();
			db.collection("stories").doc(this.storyRef).update({
				authors: this.authors
			});
		}else{
			alert("Vous ne pouvez pas vous supprimer l'accès a votre propre story.");
		}
	}
//## endregion

//## region Characters
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
//## endregion

//## region Messages
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
	    $(messageItem).find('.messageView').click(function(){editor.changeViewMode(true, editor.GetIdByMessageListElement(messageItem));changePanel('#chatPanel');});
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
			msgForm['content'].value == "text" ? $(quill.root.innerHTML).html() : "",
			msgForm['content'].value == "media" ? {type:msgForm["payload-type"].value, url:msgForm["payload-url"].value} : {},
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
		saveStory();
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
//## endregion

//## region Config
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
//## endregion



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
