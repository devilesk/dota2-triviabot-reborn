var EventEmitter = require('events').EventEmitter,
    QuestionModule = require("./question.js"),
    QuestionProducer = QuestionModule.QuestionProducer,
    Hint = QuestionModule.Hint,
    fs = require("fs"),
    util = require("util");
    
var Round = function (trivia) {
    var self = this;
    EventEmitter.call(this);
    this.trivia = trivia;
    this.questionProducer = new QuestionProducer();
    this.trivia.options.questionSources.forEach(function (item) {
        self.questionProducer.addSource(item.path, item.questionModifier, item.weight);
    });
    this.question = null;
    this.answer = null;
    this.hint = null;
    this.startTime;
    this.timer;
    this.inProgress = false;
    this.answered = false;
    this.guesses = {};
    this.unansweredCount = 0;
    this.streak = {
        accountId: null,
        personaName: null,
        count: 0
    }
    this.restartTimer = null;
    this.periodicMessageCount = this.trivia.options.periodicMessageCount;
    this.periodicMessageTimer = null;
}

Round.prototype.start = function () {
    console.log('round start');
    this.inProgress = true;
    this.answered = false;
    this.startTime = new Date();
    this.getQuestion();
    clearInterval(this.timer);
    this.trivia.bot.sendMessage(this.trivia.options.channel, this.question);
    this.timer = setInterval(this.timerProcess.bind(this), this.trivia.options.hintInterval);
}

Round.prototype.timerProcess = function () {
    //console.log('timerProcess', this.hint.count, this.hint.maxHints, this.hint.count <= this.hint.maxHints);
    if (this.hint.count <= this.hint.maxHints) {
        this.trivia.bot.sendMessage(this.trivia.options.channel, this.hint.get(), null, this.isUnansweredCheck.bind(this));
    }
    else {
        clearInterval(this.timer);
        var streakMessage = this.getEndStreakMessage();
        var reply = util.format("Time's up! The answer is %s.%s", this.answer, streakMessage);
        this.trivia.bot.sendMessage(this.trivia.options.channel, reply, this.onUnansweredEnd.bind(this), this.isUnansweredCheck.bind(this));
    }
}

Round.prototype.onUnansweredEnd = function (isValid) {
    if (this.inProgress) {
        console.log('onUnansweredEnd', isValid);
        this.answered = false;
        this.unansweredCount++;
        this.end();
        this.streak = {
            accountId: null,
            personaName: null,
            count: 0
        }
        if (this.unansweredCount > this.trivia.options.unansweredThreshold) {
            this.trivia.bot.sendMessage(this.trivia.options.channel, this.trivia.options.keepAlivePrompt, this.startKeepAliveCheck.bind(this));
        }
        else {
            this.preStart();
        }
    }
}

Round.prototype.startKeepAliveCheck = function () {
    if (!this.restartTimer) {
        var self = this;
        this.restartTimer = setTimeout(function () {
            self.trivia.bot.Dota2.sendMessage(self.trivia.options.channel, 'Restarting.');
            self.trivia.bot.Dota2.exit();
            console.log('Dota 2 exited');
            setTimeout(function() {
                console.log('process ending');
                process.exit(0);
            }, 5000);
        }, this.trivia.options.keepAliveResponseWait);
    }
}

Round.prototype.isUnansweredCheck = function () {
    return !this.answered;
}

Round.prototype.end = function () {
    console.log('end');
    this.inProgress = false;
    clearInterval(this.timer);
    this.guesses = {};
    this.endTime = new Date();
    this.question = null;
    this.answer = null;
    this.hint = null;
    /*this.streak = {
        accountId: null,
        personaName: null,
        count: 0
    }*/
    this.periodicMessageCount--;
    if (this.periodicMessageCount <= 0) {
        if (this.trivia.options.periodicMessage) this.periodicMessageTimer = setTimeout(this.sendPeriodicMessage.bind(this), this.trivia.options.nextQuestionDelay / 2);
        this.periodicMessageCount = this.trivia.options.periodicMessageCount;
    }
}

Round.prototype.sendPeriodicMessage = function () {
    this.trivia.bot.sendMessage(this.trivia.options.channel, this.trivia.options.periodicMessage);
}

Round.prototype.preStart = function () {
    console.log('preStart');
    setTimeout(this.start.bind(this), this.trivia.options.nextQuestionDelay);
}

Round.prototype.getQuestion = function () {
    var data = this.questionProducer.getQuestion();
    console.log('getQuestion', data);
    this.question = data[0];
    this.answer = data[1];
    this.hint = new Hint(this.answer, this.trivia.options.maxHints);
}

Round.prototype.resetUnansweredCount = function () {
    var self = this;
    this.trivia.bot.plugins.filter(function (plugin) { return plugin.name == self.trivia.name; }).forEach(function (plugin) {
        plugin.round.unansweredCount = 0;
    });
}

Round.prototype.onChatMessage = function (channel, personaName, message, chatObject) {
    if (this.inProgress && !this.answered) {
        if (message.toLowerCase().trim() === this.answer.toLowerCase().trim()) {
            console.log('ANSWERED');
            this.answered = true;
            this.resetUnansweredCount();
            var reply_format = '%s is correct! The answer is ' + this.answer + '.%s (+%s points, %s total) [%s ms]';
            var guesses = this.guesses[chatObject.accountId];
            this.end();
            var self = this;
            this.trivia.userCollection.get(chatObject.accountId, function (user) {
                var streakMessage = self.getStreakMessage(chatObject);
                var pointReward = self.getPointsForAnswer(chatObject.accountId, guesses);
                self.trivia.userCollection.giveUserPoints(chatObject.accountId, personaName, pointReward);
                var reply = util.format(reply_format, personaName, streakMessage, pointReward, user.points + pointReward, self.elapsedTime());
                self.trivia.bot.sendMessage(self.trivia.options.channel, reply, self.preStart.bind(self));
            }, personaName);
        }
        else {
            if (this.guesses[chatObject.accountId] === undefined) {
                this.guesses[chatObject.accountId] = 1;
            }
            else {
                this.guesses[chatObject.accountId] += 1;
            }
        }
    }
}

Round.prototype.getEndStreakMessage = function () {
	var msg = '';
	if (this.streak.accountId !== null) {
		if (this.streak.count > 1) {
            msg = util.format(" %s's answer streak of %s has ended!", this.streak.personaName, this.streak.count);
		}
	}
	return msg;
}

Round.prototype.getStreakMessage = function (chatObject) {
	var msg = ''
	if (this.streak.accountId === null) {
		this.streak.count = 1;
	}
	else if (this.streak.accountId === chatObject.accountId) {
		this.streak.count++;
		if (this.streak.count > 1) {
			msg = util.format(' %s has answered %s in a row!', chatObject.personaName, this.streak.count);
		}
	}
	else if (this.streak.accountId !== chatObject.accountId) {
		if (this.streak.count > 1) {
            msg = util.format(" %s has ended %s's streak of %s!", chatObject.personaName, this.streak.personaName, this.streak.count);
		}
		this.streak.count = 1;
	}
	this.streak.accountId = chatObject.accountId;
	this.streak.personaName = chatObject.personaName;
    this.trivia.userCollection.updateUserStreak(this.streak.accountId, this.streak.count);
	return msg;
}

Round.prototype.getPointsForAnswer = function(accountId, guesses) {
    if (guesses === undefined) {
        return this.trivia.options.maxPointsPerAnswer;
    }
    else {
        return Math.max(this.trivia.options.maxPointsPerAnswer - guesses, 1);
    }
}

Round.prototype.elapsedTime = function () {
    return new Date() - this.startTime;
}

exports.Round = Round;