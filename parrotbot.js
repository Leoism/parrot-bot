/* MAIN START */
const TeleBot = require('node-telegram-bot-api')
const token 	= 'API_KEY'
const bot 		= new TeleBot(token, {polling: true});

var user = []
var chat = []

function pickUser(userID, chatID) {
		user.push(userID)
		chat.push(chatID)
}

function mock(text) {
	var ret = ' '
	text = text.toLowerCase()
	for(var i = 0; i < text.length; ++i) {
		var flip = Math.random() >= 0.5

		if(text.charCodeAt(i) > 127) {
			flip = false
		}

		var character = text[i]

		if(flip) {
			character = character.toUpperCase()
		}

		ret += character
	}
	return ret

}

function writeDisk(name, data) {
	var fs = require('fs')

	var str = JSON.stringify(data, null, 4) 

	fs.writeFileSync(name, str)
}

function readDisk(name) {
	var fs = require('fs')

	var str = fs.readFileSync(name)

	return JSON.parse(str)
}

function addInventory(chatID, userID, item) {
	var inventory = readDisk(__dirname + '/inventory.json')
	var strInv	  = JSON.stringify(inventory, null, 4)

	if(!(chatID in inventory)) {
		//create an empty object for the chat.
		inventory[chatID] = {}
	}

	var peopleInChat = inventory[chatID]

	if (userID in peopleInChat) {
		console.log('yes')
		
		peopleInChat[userID].fish.push(item)
		
	}

	if(!(userID in peopleInChat)) {
		peopleInChat[userID] = {
			'fish': [item]
		}
	}

	writeDisk(__dirname + '/inventory.json', inventory)

	return true

}

function callInventory(chatID, userID) {
	var inventory = readDisk(__dirname + '/inventory.json')

	if(!(userID in inventory[chatID])) {
		return false
	}

	var inventoryInChat = inventory[chatID][userID].fish

	var str = JSON.stringify(inventoryInChat)

	return str.replace(/,/g, '\n').replace(/"/g, '').replace("[", '*').replace(']', '*')
	
}

function removeInventory(chatID, userID, item) {
	var inventory = readDisk(__dirname + '/inventory.json')

	if(!(userID in inventory[chatID])) {
		return false
	}

	var inventoryInChat = inventory[chatID][userID].fish

	if(item == undefined) {
		return bot.sendMessage(chatID, 'You need to specify what you want to feed the parrot')
	}

	if(inventoryInChat.indexOf(item) < 0) {
		bot.sendMessage(chatID, 'You dont seem to have ' + item + ' in your inventory, try another item.')
     return false
	}

	bot.sendMessage(chatID, 'You fed the parrot ' + item) 

    inventoryInChat.splice(inventoryInChat.indexOf(item), 1)	

	writeDisk(__dirname + '/inventory.json', inventory)
}


bot.on('message', function(msg) {
	var picked = Math.random()
	
	if(msg.text == undefined) return

	if(msg.text.indexOf('/') == 0 || msg.text.indexOf('!') == 0 || msg.text.indexOf('#') == 0 || msg.text.indexOf('.') == 0) return

	if ((picked > .75) && chat.indexOf(msg.chat.id) < 0) {
		pickUser(msg.from.id, msg.chat.id)		
	}

	if(chat.indexOf(msg.chat.id) >= 0 && (user[chat.indexOf(msg.chat.id)] == msg.from.id)) {
			var message = 'squawk ' + msg.text.toUpperCase() + ' feed me! caw caw'

			bot.sendMessage(msg.chat.id, mock(message))

	}
})

bot.onText(/^[\/!#.]fish$/, function (msg) {
	var fishes = ['salmon', 'bass', 'goldfish', 'carp',
				  'crappie', 'trout', 'tuna', 'mullet']

	var fish = fishes[Math.floor(Math.random() * fishes.length)]

	if(Math.random() >= 0.7) {
		bot.sendMessage(msg.chat.id, `Congratulations you caught a _${ fish }_! It has now been added to your inventory.`, {
			parse_mode: 'markdown'
		})
	addInventory(msg.chat.id, msg.from.id, fish)
	} else {
		bot.sendMessage(msg.chat.id, 'Nothing seems to be biting')
	}
})

bot.onText(/^[\/!#.]inventory$/, function (msg) {
	if (!(callInventory(msg.chat.id, msg.from.id) == false)) {
		var tmp = 'Your current inventory in ' + msg.chat.title + ': \n'
		tmp += callInventory(msg.chat.id, msg.from.id)

		bot.sendMessage(msg.chat.id, tmp, {
			parse_mode: 'markdown'
		})
	}
})

bot.onText(/^[\/!#.]fish(@\w+)/, function (msg) {
	var fishes = ['salmon', 'bass', 'goldfish', 'carp',
				  'crappie', 'trout', 'tuna', 'mullet']

	var fish = fishes[Math.floor(Math.random() * fishes.length)]

	if(Math.random() >= 0.7) {
		bot.sendMessage(msg.chat.id, `Congratulations you caught a _${ fish }_! It has now been added to your inventory.`, {
			parse_mode: 'markdown'
		})
	addInventory(msg.chat.id, msg.from.id, fish)
	} else {
		bot.sendMessage(msg.chat.id, 'Nothing seems to be biting')
	}
})

bot.onText(/^[\/!#.]inventory(@\w+)/, function (msg) {
	if (!(callInventory(msg.chat.id, msg.from.id) == false)) {
		var tmp = 'Your current inventory in ' + msg.chat.title + ': \n'
		tmp += callInventory(msg.chat.id, msg.from.id)

		bot.sendMessage(msg.chat.id, tmp, {
			parse_mode: 'markdown'
		})
	}
})

bot.onText(/^[\/!#.]feed ([a-z]+)/, function(msg, match) {
	var food = match[1]
	var current = chat.indexOf(msg.chat.id)

	if(msg.reply_to_message.from.id == 543696184 && user[current] == msg.from.id && removeInventory != false) {
		removeInventory(msg.chat.id, msg.from.id, food)

		chat.splice(current, 1)
		user.splice(current, 1)
	} else {
		bot.sendMessage(msg.chat.id, `I'm sorry but I don't want food from you.`)
	}
	
})
