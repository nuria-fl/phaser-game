module.exports = function(){
  // create background music
  this.music = this.game.add.audio('bgm');
  this.music.loopFull()

  this.camera.flash('0x000000')

  // create sound entities
  this.sfx = {
    key: this.game.add.audio('sfx:key'),
    door: this.game.add.audio('sfx:door'),
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp')
  };

  this.game.add.image(0, 0, 'background')
  this._loadLevel(this.game.cache.getJSON(`level:${this.level}`))
  this._createHud();
};
