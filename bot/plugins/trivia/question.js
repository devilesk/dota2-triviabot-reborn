var EventEmitter = require('events').EventEmitter,
    fs = require("fs"),
    util = require("util");
    
String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

String.prototype.replaceAt=function(index, character) {
      return this.substr(0, index) + character + this.substr(index+character.length);
}

Array.prototype.shuffle = function() {
    var counter = this.length, temp, index;
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        temp = this[counter];
        this[counter] = this[index];
        this[index] = temp;
    }
    return this;
}

var Hint = function Hint(answer, maxHints) {
    this.count = answer.length == 0 ? 1 : 0;
    
    this.value = new Array(answer.length + 1).join('*');
    for(var i = 0; i < answer.length; i++) {
        if (answer[i] === ' ' || answer[i] === '.' || answer[i] === '-') {
            this.value = this.value.replaceAt(i, answer[i]);
        }
    }
    
    this.hiddenIndices = [];
    for(var i=0; i < this.value.length; i++) {
        if (this.value[i] === '*') {
            this.hiddenIndices.push(i);
        }
    }
    this.hiddenIndices = this.hiddenIndices.shuffle();
    
    this.hiddenIndicesLength = this.hiddenIndices.length;
    this.maxHints = this.hiddenIndicesLength == 1 ? 1 : Math.min(this.hiddenIndicesLength - 1, maxHints);
    this.charsPerHint = this.hiddenIndicesLength == 1 ? 0 : Math.floor((this.hiddenIndicesLength - 1 ) / this.maxHints);
    this.get = function () {
        if (this.count > 0 && this.count <= this.maxHints) {
            for(var i = 0; i < this.charsPerHint; i++) {
                var c = this.hiddenIndices.pop();
                this.value = this.value.replaceAt(c, answer[c]);
            }
        }
        this.count++;
        return this.value;
    }
}

var QuestionSource = function QuestionSource(path, questionModifier) {
    this.path = path || '';
    this.data = [];
    this.questionModifier = this.questionModifiers.hasOwnProperty(questionModifier) ? this.questionModifiers[questionModifier] : function (data) { return data };
    this.loadFile();
}

QuestionSource.prototype.getQuestion = function () {
    if (this.data.length === 0) this.loadFile();
    return this.questionModifier(this.data.pop().split('*'));
}

QuestionSource.prototype.loadFile = function () {
    this.data = fs.readFileSync(this.path, 'utf8').trim('\n').split('\n').shuffle();
}

QuestionSource.prototype.destroy = function () {}

var h = QuestionSource.prototype.questionModifiers = {};

h['scramble'] = function (data) {
    var original = data[1].replace(/\s+/g, '').toLowerCase();
    var a = original;
    while (original === a && original.length > 1) {
        a = a.shuffle();
    }
    data[0] = data[0] + ' ' + a;
    return data;
}

var QuestionProducer = function QuestionProducer() {
    this.sources = [];
    this.weights = [];
}

QuestionProducer.prototype.addSource = function (path, questionModifier, weight) {
    this.sources.push(new QuestionSource(path, questionModifier));
    this.weights.push(weight);
}

QuestionProducer.prototype.getQuestion = function() {
	var n = Math.random();
    var sum = 0;
    for (var i = 0; i < this.weights.length; i++) {
        sum += this.weights[i];
        if (n < sum) {
            return this.sources[i].getQuestion();
        }
    }
    return this.sources[this.sources.length - 1].getQuestion();
}

QuestionProducer.prototype.loadFiles = function () {
    this.sources.forEach(function (source) { source.loadFile(); });
}

QuestionProducer.prototype.destroy = function () {
    this.sources.forEach(function (source) { source.destroy(); });
}

exports.Hint = Hint;
exports.QuestionSource = QuestionSource;
exports.QuestionProducer = QuestionProducer;