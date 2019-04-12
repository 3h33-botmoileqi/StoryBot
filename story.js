class Story {
	constructor(chatElement){
		this.config = {
			"storyName":"New Story",
			"adsEachMessage": -1,
			"displaycharacterName":true,
			"displaycharacterAvatar":true,
			"displayMessageDate":true,
			"customCSS":{}
		};
		this.characters = {};
		this.conversation = [];
		this.messagesGroup = [];
		this.chatElement = chatElement;
		this.id =0;
		this.editor = false;
		this.loadDemo();
	}

	contructor(story, chatElement){

		generateMessagesGroup();
	}

	log(){
		console.log(this);
	}

	waitFor(delay) {
	    return new Promise(resolve => {
	      setTimeout(() => {
	        resolve('resolved');
	      }, delay);
	    });
	  }

	async playStory(id = 0){
		this.id = id;
		$(this.chatElement).empty();
		this.generateMessagesGroup();
		var messagesGroup = null;
		var lastCharacter = this.conversation[0].character;
	    let tapeRequiredFlag = false;
	    while(this.id < this.conversation.length && !tapeRequiredFlag){
	      if(this.conversation[this.id].tapeFlag){
	          tapeRequiredFlag = true;
	      }else{
	        await this.waitFor(this.editor ? 0 : this.conversation[this.id].delay);
	        //this.insertChat(array[this.state.displayStory.length], true)
	        //chatElement.append(this.conversation[this.id].output());
	        if(messagesGroup == null || this.conversation[this.id].character !== lastCharacter){
	        	lastCharacter = this.conversation[this.id].character;
	        	messagesGroup = this.MessageGroupDom(this.conversation[this.id].side, lastCharacter)
	        	$(this.chatElement).append(messagesGroup);
	        }
	        this.insertMessageElement($(this.conversation[this.id].toDOM(this.editor)), $(messagesGroup).children("ul"));
	        //$("#mainContent").scrollTop($("#mainContent").prop('scrollHeight'));
	        var page = $(this).attr('href'); // Page cible
			var speed = 750; // Durée de l'animation (en ms)
			$("#chatPanel").animate( { scrollTop: $("#chatPanel").prop('scrollHeight') }, speed ); // Go
	        this.id++;
	      }
	    }
	    //Si la story est fini sinon attend un touch
	    if(this.id >= this.conversation.length)
	      console.log('Done!');
	}
	/******************* Character Management ***********************/

	DeleteCharacter(characterName){
    	delete this.characters[characterName]
	}

	/******************* MESSAGE DOM Management**********************/

	MessageGroupDom(side, lastCharacter){
		return $(`
			<li class="messagesGroup">
    			<div class="messagesGroup-header header-${side}">
    				<div>
    					${this.config.displaycharacterAvatar ? `<img class="avatar" src="${this.characters[lastCharacter].avatar}"/>` : ""}
    					${this.config.displaycharacterName ? `<h6>${lastCharacter}</h6>` : ""}
    				</div>
    			</div>
    			<ul></ul>
	        </li>`);
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

	EditMessageElement(message, newMessage){
		let newMessageElement = $(newMessage.toDOM(this.editor));
		$(message).replaceWith(newMessageElement);
    	this.conversation.splice(this.GetIdByMessageElement(message), 1, newMessage);
	}

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
		this.GetMessageElementById(id).replaceWith(this.conversation[id].toDOM(this.editor));
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
		this.characters = {"Personnage1":{"avatar":"https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48","defaultSide":"left"},"Personnage2":{"avatar":"https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg","defaultSide":"right"},"Personnage3":{"avatar":"https://yt3.ggpht.com/a-/AN66SAyjHOM6XYXi_WmTK5F3GJ0pu3G5nQg1gVS4aA=s48-c-k-c0xffffffff-no-rj-mo","defaultSide":"left"}}
		var conversation = [{"character":"Personnage1","timestamp":1521374361,"text":"Bonjour !","payload":{},"delay":0,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Hey, comment ça va ?","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage1","timestamp":1521374361,"text":"Très bien ! Regarde mon nouveau Poster !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage1","timestamp":1521374361,"text":"","payload":{"type":"image","url":"https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"},"delay":2000,"tapeFlag":false, "side":"left"},{"character":"Personnage3","timestamp":1521374361,"text":"C'est ma photo !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Bravo vous deux !","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage2","timestamp":1521374361,"text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.","payload":{},"delay":0,"tapeFlag":false, "side":"right"}];
		for(var message of conversation){
			this.conversation.push(new Message(message.character, message.side, message.text, message.payload, message.timestamp, message.delay, message.tapeFlag, false))
		}
		this.generateMessagesGroup();
		this.log();
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

	changeText(text){
		this.text = text;
	}

	toDOM(withEditorTools){
		let message = $(`<li class="message message-${this.side}">
					<div class="message-container">
						<div class="${this.text ? "text" : this.payload.type}" ${this.text ? 'contenteditable="false"' : ""}>${this.loadContent()}</div>
						<div class="Date">${this.GetTime()}</div>
					</div>
				</li>`);
		//${withEditorTools ? '<div class="tools-container"><button class="messageEdit"><i class="fas fa-edit"></i></button><button class="messageDelete"><i class="fas fa-times"></i></button></div>' : ""}
		/*if(withEditorTools){
        	$(message).find('.messageEdit').click(function(){$('.page').hide();$('#messagePanel').show();editor.LoadSelectedMessage(editor.GetIdByMessageElement(message));});
        	$(message).find('.messageDelete').click(function(){editor.DeleteMessageEditor(editor.GetIdByMessageElement(message))});
        	$(message).find('.text').on('input',function(){editor.onMessageInput(message, $(this).text())});
		}*/
		return message;
	}

	GetTime() {
		var date = new Date(this.timestamp*1000);
	    var hours = date.getHours();
	    var minutes = date.getMinutes();
	    var ampm = hours >= 12 ? 'PM' : 'AM';
	    hours = hours % 12;
	    hours = hours ? hours : 12; // the hour '0' should be '12'
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
                	return null;
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
	constructor(chatElement, charactersList){
		super(chatElement);
		this.editor = true;
		this.charactersList = $(charactersList);
	}

	loadEditor(){
		this.loadCharacters();
		this.loadMessages();
	}

	StartStoryEditor(){
		$("#chat").empty();
		this.playStory();
	}

	loadCharacters(){
		let list = this.charactersList;
		$(list).each(function(indexList, list){
			$(list).html("");
			$.each(editor.characters,function(characterName, character){
				if($(list).is("#mainCharacterList")){
					let characterItem = editor.characterItemDom(characterName);
					$(list).append(characterItem);
				}else{
					$(list).append(`<option value="${characterName}">${characterName}</option>`);
				}
			});
		})
	}

	characterItemDom(characterName){
		let characterItem = $(`
			<li id="character-${characterName}" class="list-group-item d-flex align-items-center">
				<img class="avatar" src="${this.characters[characterName].avatar}"/>
				<div class="flex-grow-1 text">${characterName}</div>
				<div class="btn-group tools">
					<button class="btn btn-secondary characterEdit"><i class="fas fa-user-edit"></i></button>
					<button class="btn btn-secondary characterDelete"><i class="fas fa-times"></i></button>
				</div>
			</li>
			`);
	    $(characterItem).find('.characterEdit').click(function(){editor.LoadSelectedCharacter(characterName);});
	    $(characterItem).find('.characterDelete').click(function(){editor.DeleteCharacterEditor(characterName)});
	    return characterItem;
	}

	characterFormSubmit(){
		let charaForm = document.forms["characterForm"];
		let isNew = charaForm["isNew"].value;
		let characterNameOld = charaForm["characterName"].value;
		let characterName = charaForm["name"].value;
		let character = {avatar: charaForm["avatar"].value, defaultSide: charaForm["defaultSide"].value}
		if(isNew === "true"){
			this.insertCharacterEditor(character, characterName);
		}
		else{
			this.editCharacterEditor(character, characterName, characterNameOld);
		}
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
		let list = this.charactersList;
		$(list).each(function(indexList, list){
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
		let list = this.charactersList;
		$(list).each(function(indexList, list){
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
		let charaForm = document.forms["characterForm"];
		charaForm["characterName"].value = characterName;
		charaForm["isNew"].value = isNew;
		let chara = this.characters[characterName];
		charaForm["name"].value = "";
		charaForm["avatar"].value = "";
		charaForm["defaultSide"].value = "";
		if(!isNew){
				charaForm["name"].value = characterName;
				charaForm["avatar"].value = chara.avatar;
				charaForm["defaultSide"].value = chara.defaultSide;
		}
	}

	loadMessages(){
		this.conversation.forEach(function(message, index){
			let messageItem = editor.messageItemDom(message, index);
			$("#messageList").append(messageItem);
		});
	}

	GetIdByMessageListElement(element){
		console.log($(element).index('#messageList>li'));
		return $(element).index('#messageList>li');
	}

	GetMessageListElementById(id){
		return $($(`#messageList>li`).get(id));
	}

	messageItemDom(message, index){
		let messageItem = $(`
			<li class="list-group-item d-flex align-items-center">
				<img class="avatar" src="${this.characters[message.character].avatar}"/>
				<div class="flex-grow-1 ${message.text ? "text" : ""}" contenteditable="true" style="padding-left:5%;">${message.text ? message.text : message.payload.type}</div>
				<div class="btn-group tools">
					<button class="btn btn-secondary messageEdit"><i class="fas fa-edit"></i></button>
					<button class="btn btn-secondary messageDelete"><i class="fas fa-times"></i></button>
					<button class="btn btn-secondary messageUp"><i class="fas fa-arrow-up"></i></button>
					<button class="btn btn-secondary messageDown"><i class="fas fa-arrow-down"></i></button>
				</div>
			</li>
			`);
	    $(messageItem).find('.messageEdit').click(function(){editor.LoadSelectedMessage(index);});
	    $(messageItem).find('.messageDelete').click(function(){editor.DeleteMessageEditor(index)});
	    $(messageItem).find('.messageUp').click(function(){editor.MoveSelectedMessage(editor.GetIdByMessageListElement(messageItem), -1);});
	    $(messageItem).find('.messageDown').click(function(){editor.MoveSelectedMessage(editor.GetIdByMessageListElement(messageItem), 1)});
        $(messageItem).find('.text').on('input',function(){editor.onMessageInput(editor.GetIdByMessageListElement(messageItem), $(this).text());});
	    return messageItem;
	}

	MoveSelectedMessage(currentId, move){
		var target = $(`#messageList>li:nth-child(${(currentId+move)+1})`);
		if(move > 0){
			target.after($(this.GetMessageListElementById(currentId)).detach());
		}else{
			target.before($(this.GetMessageListElementById(currentId)).detach());
		}
		this.conversation.splice((currentId+move),0 ,this.conversation.splice(currentId,1)[0]);
	}

	messageFormSubmit(){
		let msgForm = document.forms["messageForm"];
		let isNew = msgForm["isNew"].value;
		let id = msgForm["messageId"].value;
		console.log(msgForm["character"].value);
		let message = new Message(
			msgForm["character"].value,
			msgForm["side"].value,
			$(quill.root.innerHTML).html(),
			{type:msgForm["payload-type"].value, url:msgForm["payload-url"].value},
			new Date(msgForm["datetime"].value).getTime() /1000,
			msgForm["delay"].value * 1000,
			msgForm["tapeFlag"].value,
			msgForm["adsFlag"].value
			);
		console.log(isNew);
		if(isNew === "true"){
			this.insertMessageEditor(id, message);	
		}else{
			this.editMessageEditor(id, message);
		}

		$("#messageFormContainer").hide();
		$("#messageListContainer").show();
	}
	insertMessageEditor(id, message){
		//let messageDom = $(message.toDOM(this.editor));
		this.conversation.splice(id,0 ,message);
		/*console.log(this.conversation);
		if(id > 0 && id < this.conversation.length -1){
			if(this.conversation[id-1].character !== message.character && this.conversation[id+1].character === this.conversation[id-1].character){
				//split message group
				console.log("split message group");
			}
			else if(this.conversation[id-1].character === message.character){
				console.log("append after");
				this.GetMessageElementById(id-1).after($(messageDom));
			}
			else if(this.conversation[id+1].character === message.character){
				//Append before
				console.log("append before:")
				console.log(this.conversation[id]);
				console.log(this.GetMessageElementById(id));
				this.GetMessageElementById(id).before(messageDom);
			}
			else{
				//New Message Group
				var messagesGroup = this.MessageGroupDom(message.side, message.character);
				this.GetMessageElementById(id-1).closest(".messagesGroup").after($(messagesGroup));
				messagesGroup.children("ul").append($(messageDom));	
			}
		}else if(id == 0){
			if(this.conversation[1].character === message.character){
				this.GetMessageElementById(1).before($(messageDom));
			}
			else{
				console.log("trouver")
				var messagesGroup = this.MessageGroupDom(message.side, message.character);
				console.log(this.GetMessageElementById(0).closest(".messagesGroup"));
				this.GetMessageElementById(0).closest(".messagesGroup").before($(messagesGroup));
				messagesGroup.children("ul").append($(messageDom));
			}
		}else{
			console.log("Append at the end character:"+message.character + "/id:"+ id +"(last message:"+this.conversation[this.conversation.length-2].character+"/id:"+(this.conversation.length-2)+")");
			if(this.conversation[this.conversation.length-2].character === message.character){
				this.GetMessageElementById(this.conversation.length-2).after(messageDom);
			}
			else{
				var messagesGroup = this.MessageGroupDom(message.side, message.character);
				$(this.chatElement).append(messagesGroup);
				messagesGroup.children("ul").append(messageDom);
				this.conversation.push(message);
			}
		}
		return messageDom;*/
	}

	editMessageEditor(id, message){
		this.EditMessageElement($(`#chat .message`).get(id),message)
		$(`#messageList>li:nth-child(${id+1})`).replaceWith(this.messageItemDom(message, id));
	}

	DeleteMessageEditor(id){
		this.DeleteMessageElement(id);
		$(`#messageList>li:nth-child(${id+1})`).remove();
	}

	LoadSelectedMessage(id, isNew = false){
		$("#messageListContainer").hide();
		$("#messageFormContainer").show();

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
		msgForm["tapeFlag"].value = true;
		msgForm["adsFlag"].value = false;
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
			msgForm["tapeFlag"].value = msg.tapeFlag;
			msgForm["adsFlag"].value = msg.ads;
		}
	}
}