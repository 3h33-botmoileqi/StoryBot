class Story {
	constructor(chatElement){
		this.name = "New Story";
		this.config = {
			"isPublished": false,
			"adsEachMessages": -1,
			"displaycharacterName":true,
			"displaycharacterAvatar":true,
			"displayMessageDate":true,
			"customCSS":"",
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

	loadStory(story){
		this.name = story.name;
		this.config = story.config;
		this.characters = story.characters;
		this.conversation = [];
		for(let message of story.conversation){
			this.conversation.push(new Message(message.character, message.side, message.text, message.payload, message.timestamp, message.delay, message.tapeFlag, false));
			if(message.animations)
				this.conversation[this.conversation.length-1].AddAnimations(message.animations);
		}
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
		//console.log("load css");
		this.config["customCSS"] = css;
		this.cssSheet.innerHTML = this.config["customCSS"];
	}
}
