class Editor extends Story{
	/**
	* @property {Bool} editor défini la méthode d'affichage de la story par défaut true (false = user / true = editor)
	* @property {String} storyRef clé de la story pour la base de donnéelse
	* @property {Array<string>} authors Liste des uid des auteurs ayant accès a la story
	*/
	constructor(){
		super();
		this.editor = true;
		this.storyRef = null;
		this.authors = [];
		this.loadEditor();
	}
//## region Load & save
	/**
	* débute la lecture de la story
	*/
	StartStoryEditor(){
		$("#chat").empty();
		this.tapeRequiredFlag = false;
		this.playStory();
	}

	/**
	* Charge une story provenant d'une base de donnée
	*/
	loadStoryEditor(id, story){
		this.storyRef = id;
		this.authors = story.authors;
		this.loadStory(story);
		if(this.editor)
			this.loadEditor();
	}

	/**
	*charge les données de la story message / character / author dans l'éditeur
	*/
	loadEditor(){
		this.loadAuthors();
		this.loadMessages();
		this.loadCharacters();
	}
	/**
	* Sauvegarde la story dans la base de donnée
	* @param {Function} callback - exécution retour
	*/
	saveStory(callback = null){
	  db.collection("stories").doc(id).get().then(doc => {
	    doc.ref.update({
	        name: editor.name,
	        config: editor.config,
	        characters: editor.characters,
	        conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
	    })
	    localStorage["lastStory"] = doc.id;
	    if(callback != null){
	        callback();
	    }
	  })
	  .catch(err => {
	      console.log('Error updating document '+editor.storyRef, err);
	  });
	}
//## endregion

//## region Authors

	/**
	* crée l'element HTML correspondant a un auteurs & y attache les evènement neccéssaire a la gestion
	* @param {string} author - email de l'auteur
	* @param {string} uid - uid de l'auteur
	* @return {object} Jquery Element de l'auteur généré
	*/
	authorDOMElement(author, uid){
		var authorElement = $(`
			<li class="list-group-item d-flex align-items-center author">
				<div class="flex-grow-1 text">${author}</div>
				<button class="btn btn-secondary authorDelete"><i class="fas fa-times"></i></button>
			</li>`);
	    $(authorElement).find('.authorDelete').click(function(){editor.DeleteAuthor(uid)});
		return authorElement;
	}

	/**
	* Boucle de création de la liste des auteurs
	*/
	loadAuthors(){
		$("#authorsList").empty();
		for(var author of this.authors){
			db.collection("users").doc(author).get().then(doc =>{
				$("#authorsList").append(this.authorDOMElement(doc.data().email, doc.id));
			})
		}
	}
	/**
	* Check la validité d'un mail
	*/
	validateEmail(email) {
	    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(String(email).toLowerCase());
	}

	/**
	* Ajoute un nouvelle auteur a la story
	* @param {String} author - email du nouvelle auteur
	*/
	AddAuthor(author){
	if(this.validateEmail(author)){
		db.collection('users').where("email", "==", author).get().then(snapshot => {
			if(!snapshot.empty){
				if(snapshot.docs.length == 1){
					var doc = snapshot.docs[0];
					if(this.authors.findIndex(ref => ref.id === doc.id) == -1){
						this.authors.push(doc.id);
						let authorItem = this.authorDOMElement(author, doc.id);
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

	/**
	* Supprime l'accès d'un auteur à la story
	* @param {String} uid - uid de l'auteur perdant l'accès
	*/
	DeleteAuthor(uid){
		if(firebase.auth().currentUser.uid != uid){
			let id = this.authors.findIndex(ref => ref	 === uid);
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
	/**
	* Chargement par l'editeur des personnages de la Story
	*/
	loadCharacters(){
		var editorRef = this;
		 $(".characterList").each(function(indexList, list){
			$(list).empty();
			$.each(editorRef.characters,function(characterName, character){
				if($(list).is("#mainCharacterList")){
					$(list).append(editorRef.characterItemDom(characterName));
				}else{
					$(list).append(`<option value="${characterName}">${characterName}</option>`);
				}
			});
		})
	}

	/**
	* crée l'element HTML correspondant a un personnage & y attache les evènement neccéssaire a la gestion
	* @param {string} characterName - nom du personnage
	* @return {object} Jquery Element du personnage généré
	*/
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
	/**
	* Reception du formulaire de Personnage
	*/
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

	/**
	* Rajoute a la story un nouveau personnage
	* @param {Object} character - informations concernant le personnage
	* @param {String} characterName - nom du personnage
	*/
	insertCharacterEditor(character, characterName){
		this.characters[characterName] = character;
		this.loadCharacters();
	}

	/**
	* Edition des informations d'un personnage de la storyRef
	* @param {Object} character - informations concernant le personnage
	* @param {String} characterName - nouveau nom du personnage
	* @param {String} characterNameOld - ancien nom du personnage
	*/
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

	/**
	* Suppression d'un personnage de la story
	* @param {String} characterName - nouveau nom du personnage
	*/
	DeleteCharacterEditor(characterName){
		for (var i = 0; i <this.conversation.length ; i++) {
			if(this.conversation[i].character == characterName){
				this.DeleteMessageEditor(i);
				i--
			}
		}
		delete this.characters[characterName]
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

	/**
	* Chargement des informations concernant un personnage dans le formulaire des Personnage
	* @param {String} characterName - nouveau nom du personnage
	* @param {Bool} isNew - Flag pour un nouveau Personnage par défaut il n'est pas un nouveau
	*/
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


	/**
	* Chargement par l'editeur des messages de la Story
	* Ajoute un formulaire pour l'ajout de message rapide a la fin de la liste de message
	*/
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
	/**
	* Déclenche le Scroll automatique pour atteindre le bas de la liste des messages
	*/
	MessagelistScrollDown(){
		$("#messageList").animate( { width: "ease-out",scrollTop: $("#messageList").prop('scrollHeight') }, 750 ); // Go
	}

	/**
	* Récupère l'id d'un message a partir de son element html
	* @param {Object} element - Jquery Element du message
	* @return {Number} index du message
	*/
	GetIdByMessageListElement(element){
		return $(element).index('#messageList>.messageItem');
	}

	/**
	* Récupère l'element HTML d'un message a partir de sont index
	* @param {Number} id - index du message
	* @return {Object} Jquery Element du message
	*/
	GetMessageListElementById(id){
		return $($(`#messageList>.messageItem`).get(id));
	}

	/**
	* crée l'element HTML correspondant a un message & y attache les evènement neccéssaire a la gestion
	* @param {Object} message - toutes les informations concernant le message
	* @param {Number} index - index du message
	* @return {Object} Jquery Element du message
	*/
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

	/**
	* Reçois les évenement d'édition instantané des messages
	* @param {Number} id - index du message
	* @param {String} text - nouveau text du message
	*/
	onMessageInput(id, text){
		this.conversation[id].text = text;
		this.GetMessageElementById(id).replaceWith(this.conversation[id].toDOM(this.config.displayMessageDate));
	}

	/**
	* déplace l'index d'un message
	* @param {Number} currentId - index actuel du message
	* @param {Number} move - direction du déplacement (1 = vers la fin / -1 = vers le début)
	*/
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
	/**
	* reception de l'évenement du formulaire d'ajout de message rapide
	*/
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
	/**
	* Reception de l'évenement du formulaire des messages
	*/
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

	/**
	* Ajoute un nouveau message a la story
	* @param {Number} id - index de positionnement du message
	* @param {Object} message - toutes les informations concernant le messageEdit
	*/
	insertMessageEditor(id, message){
		$("#messageList>li").last().before(this.messageItemDom(message, id));
		this.conversation.splice(id,0 ,message);
		this.saveStory();
	}

	/**
	* Edition d'un message a la story
	* @param {Number} id - index de positionnement du message
	* @param {Object} message - toutes les informations concernant le messageEdit
	*/
	editMessageEditor(id, message){
		this.conversation.splice(id, 1, message);
		this.GetMessageListElementById(id).replaceWith(this.messageItemDom(message, id));
	}

	/**
	* Suppresion d'un message a la story
	* @param {Number} id - index de positionnement du message
	*/
	DeleteMessageEditor(id){
		this.conversation.splice(id, 1);
		this.GetMessageListElementById(id).remove();
	}

	/**
	* Charge le formulaire des messages avec les informations neccessaire
	* @param {Number} id - index de positionnement du message
	* @param {Bool} isNew -  Flag pour un nouveau message par défaut il n'est pas un nouveau
	*/
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
	/**
	* Réception de l'évenement de soumission du formulaire de paramétrage de story
	*/
	configFormSubmit(){
		let configForm = document.forms["configForm"];
		this.name = configForm['storyName'].value;
		this.config.isPublished = configForm['isPublish'].checked;
		this.config.displaycharacterName = configForm['displaycharacterName'].checked;
		this.config.displaycharacterAvatar = configForm['displaycharacterAvatar'].checked;
		this.config.displayMessageDate = configForm['displayMessageDate'].checked;
		if(configForm['adsFlag'].value == true)
			this.config.adsEachMessage = configForm['adsEachMessages'].value;
		else
			this.config.adsEachMessage = 0;
	}

	/**
	* Charge le formulaire de paramètrage de la story avec les informations néccessaire
	*/
	loadConfig(){
		let configForm = document.forms["configForm"];
		configForm['storyName'].value = this.name;
		configForm['isPublish'].checked = this.config.isPublished;
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

	/**
	* alterne entre affichage des messages instantané & affichage simulaire au lecteur (affichage des messages progressif selon paramètre de la story)
	* @param {Bool} mode - Flag définissant le mode a utilisé (false = user / true = editor)
	* @param {Number} resumeId - défini un nombre de message a afficher instantanément avant de revenir a un affichage de lecteur
	*/
	changeViewMode(mode, resumeId = -1){
		this.resumeId = resumeId;
		//this.editor = mode;
		if(mode === false){
			$("#viewMode").prop("checked", false);
			this.editor=true;
			if(this.tapeRequiredFlag){
				this.tapeRequiredFlag = false;
				$("#tapeLogo").hide();
			}
		}else if(mode === true){
			$("#viewMode").prop("checked", true);
			this.editor=false;
		}
		else{
			console.error("mode unknow");
		}
		this.StartStoryEditor();
	}
}
