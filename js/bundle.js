(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function Hero(game, x, y) {
  // call Phaser.Sprite constructor
  Phaser.Sprite.call(this, game, x, y, 'hero');
  this.anchor.set(0.5, 0.5);

  this.animations.add('stop', [0]);
  this.animations.add('run', [1, 2], 8, true); // 8fps looped
  this.animations.add('jump', [3]);
  this.animations.add('fall', [4]);
  this.animations.add('die', [5, 6, 5, 6, 5, 6, 5, 6], 12); // 12fps no loop

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
}

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
  var SPEED = 200;
  this.body.velocity.x = direction * SPEED;
  if (this.body.velocity.x < 0) {
    this.scale.x = -1;
  } else if (this.body.velocity.x > 0) {
    this.scale.x = 1;
  }
};

Hero.prototype.jump = function () {
  var JUMP_SPEED = 600;
  var canJump = this.body.touching.down && this.alive;

  if (canJump) {
    this.body.velocity.y = -JUMP_SPEED;
  }

  return canJump;
};

Hero.prototype.bounce = function () {
  var BOUNCE_SPEED = 200;
  this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype._getAnimationName = function () {
  var name = 'stop'; // default animation

  if (!this.alive) {
    name = 'die';
  }
  // jumping
  if (this.body.velocity.y < 0) {
    name = 'jump';
  }
  // falling
  else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
      name = 'fall';
    } else if (this.body.velocity.x !== 0 && this.body.touching.down) {
      name = 'run';
    }

  return name;
};

Hero.prototype.update = function () {
  // update sprite animation, if it needs changing
  var animationName = this._getAnimationName();
  if (this.animations.name !== animationName) {
    this.animations.play(animationName);
  }
};

Hero.prototype.die = function () {
  this.alive = false;
  this.body.enable = false;
  this.animations.play('die').onComplete.addOnce(function () {
    this.kill();
  }, this);
};

module.exports = Hero;

},{}],2:[function(require,module,exports){
'use strict';

function Spider(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'spider');

  this.anchor.set(0.5, 0.5);
  // animation
  this.animations.add('crawl', [0, 1, 2], 8, true);
  this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
  this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
  this.animations.play('crawl');

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
  this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
  // check against walls and reverse direction if necessary
  if (this.body.touching.right || this.body.blocked.right) {
    this.body.velocity.x = -Spider.SPEED; // turn left
  } else if (this.body.touching.left || this.body.blocked.left) {
    this.body.velocity.x = Spider.SPEED; // turn right
  }
};

Spider.prototype.die = function () {
  this.body.enable = false;

  this.animations.play('die').onComplete.addOnce(function () {
    this.kill();
  }, this);
};

module.exports = Spider;

},{}],3:[function(require,module,exports){
'use strict';

module.exports = function () {
  // create background music
  this.music = this.game.add.audio('bgm');
  this.music.loopFull();

  this.camera.flash('0x000000');

  // create sound entities
  this.sfx = {
    key: this.game.add.audio('sfx:key'),
    door: this.game.add.audio('sfx:door'),
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp')
  };

  this.game.add.image(0, 0, 'background');
  this._loadLevel(this.game.cache.getJSON('level:' + this.level));
  this._createHud();
};

},{}],4:[function(require,module,exports){
"use strict";

module.exports = function (data) {
  var LEVEL_COUNT = 2;

  this.keys = this.game.input.keyboard.addKeys({
    left: Phaser.KeyCode.LEFT,
    right: Phaser.KeyCode.RIGHT,
    up: Phaser.KeyCode.UP
  });
  this.keys.up.onDown.add(function () {
    var didJump = this.hero.jump();
    if (didJump) {
      this.sfx.jump.play();
    }
  }, this);

  this.level = (data.level || 0) % LEVEL_COUNT;
  this.coinPickupCount = 0;
  this.hasKey = false;
  this.game.renderer.renderSession.roundPixels = true;
};

},{}],5:[function(require,module,exports){
'use strict';

var preload = function preload() {
  this.game.load.json('level:0', 'data/level00.json');
  this.game.load.json('level:1', 'data/level01.json');

  this.game.load.image('background', 'images/background.png');
  this.game.load.image('ground', 'images/ground.png');
  this.game.load.image('grass:8x1', 'images/grass_8x1.png');
  this.game.load.image('grass:6x1', 'images/grass_6x1.png');
  this.game.load.image('grass:4x1', 'images/grass_4x1.png');
  this.game.load.image('grass:2x1', 'images/grass_2x1.png');
  this.game.load.image('grass:1x1', 'images/grass_1x1.png');
  this.game.load.image('invisible-wall', 'images/invisible_wall.png');
  this.game.load.image('icon:coin', 'images/coin_icon.png');
  this.game.load.image('font:numbers', 'images/numbers.png');
  this.game.load.image('key', 'images/key.png');

  this.game.load.audio('bgm', ['audio/bgm.mp3', 'audio/bgm.wav']);
  this.game.load.audio('sfx:jump', 'audio/jump.wav');
  this.game.load.audio('sfx:coin', 'audio/coin.wav');
  this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
  this.game.load.audio('sfx:key', 'audio/key.wav');
  this.game.load.audio('sfx:door', 'audio/door.wav');

  this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
  this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
  this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
  this.game.load.spritesheet('door', 'images/door.png', 42, 66);
  this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
};

module.exports = preload;

},{}],6:[function(require,module,exports){
"use strict";

module.exports = function () {
  this.music.stop();
};

},{}],7:[function(require,module,exports){
"use strict";

module.exports = function () {
  this._handleCollisions();
  this._handleInput();
  this.coinFont.text = "x" + this.coinPickupCount;
  this.keyIcon.frame = this.hasKey ? 1 : 0;
};

},{}],8:[function(require,module,exports){
'use strict';

var init = require('./gameloop/init');
var preload = require('./gameloop/preload');
var create = require('./gameloop/create');
var update = require('./gameloop/update');
var shutdown = require('./gameloop/shutdown');
var Hero = require('./characters/hero');
var Spider = require('./characters/spider');

var PlayState = {
  init: init,
  preload: preload,
  create: create,
  update: update,
  shutdown: shutdown
};

// Playstate functions

PlayState._loadLevel = function (data) {
  this.bgDecoration = this.game.add.group();
  this.platforms = this.game.add.group();
  this.coins = this.game.add.group();
  this.spiders = this.game.add.group();
  this.enemyWalls = this.game.add.group();
  this.enemyWalls.visible = false;

  data.platforms.forEach(this._spawnPlatform, this); //second param to bind this
  this._spawnCharacters({ hero: data.hero, spiders: data.spiders });
  this._spawnDoor(data.door.x, data.door.y);
  this._spawnKey(data.key.x, data.key.y);

  data.coins.forEach(this._spawnCoin, this);

  var GRAVITY = 1200;
  this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._createHud = function () {
  this.keyIcon = this.game.make.image(0, 19, 'icon:key');
  this.keyIcon.anchor.set(0, 0.5);

  var coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
  var NUMBERS_STR = '0123456789X ';

  this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

  var coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
  coinScoreImg.anchor.set(0, 0.5);

  this.hud = this.game.add.group();
  this.hud.position.set(10, 10);
  this.hud.add(coinIcon);
  this.hud.add(coinScoreImg);
  this.hud.add(this.keyIcon);
};

PlayState._handleCollisions = function () {
  this.game.physics.arcade.collide(this.hero, this.platforms);
  this.game.physics.arcade.collide(this.spiders, this.platforms);
  this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

  this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
  this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
  this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this);
  this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
  // ignore if there is no key or the player is on air
  function (hero, door) {
    return this.hasKey && hero.body.touching.down;
  }, this);
};

PlayState._handleInput = function () {
  if (this.keys.left.isDown) {
    // move hero left
    this.hero.move(-1);
  } else if (this.keys.right.isDown) {
    // move hero right
    this.hero.move(1);
  } else {
    // stop
    this.hero.move(0);
  }
};

PlayState._spawnDoor = function (x, y) {
  this.door = this.bgDecoration.create(x, y, 'door');
  this.door.anchor.setTo(0.5, 1);
  this.game.physics.enable(this.door);
  this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
  this.key = this.bgDecoration.create(x, y, 'key');
  this.key.anchor.set(0.5, 0.5);
  this.game.physics.enable(this.key);
  this.key.body.allowGravity = false;

  this.key.y -= 3;
  this.game.add.tween(this.key).to({ y: this.key.y + 6 }, 800, Phaser.Easing.Sinusoidal.InOut).yoyo(true).loop().start();
};

PlayState._spawnPlatform = function (platform) {
  var sprite = this.platforms.create(platform.x, platform.y, platform.image);

  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
  sprite.body.immovable = true;

  this._spawnEnemyWall(platform.x, platform.y, 'left');
  this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
  var sprite = this.enemyWalls.create(x, y, 'invisible-wall');
  // anchor and y displacement
  sprite.anchor.set(side === 'left' ? 1 : 0, 1);

  // physic properties
  this.game.physics.enable(sprite);
  sprite.body.immovable = true;
  sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
  // spawn hero
  this.hero = new Hero(this.game, data.hero.x, data.hero.y);
  this.game.add.existing(this.hero);
  // spawn enemies
  data.spiders.forEach(function (spider) {
    var sprite = new Spider(this.game, spider.x, spider.y);
    this.spiders.add(sprite);
  }, this);
};

PlayState._spawnCoin = function (coin) {
  var sprite = this.coins.create(coin.x, coin.y, 'coin');
  sprite.anchor.set(0.5, 0.5);
  sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
  sprite.animations.play('rotate');

  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
};

PlayState._onHeroVsCoin = function (hero, coin) {
  this.sfx.coin.play();

  coin.kill();
  this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
  if (hero.body.velocity.y > 0) {
    // kill enemies when hero is falling
    hero.bounce();
    enemy.die();
    this.sfx.stomp.play();
  } else {
    hero.die();
    this.sfx.stomp.play();
    hero.events.onKilled.addOnce(function () {
      this.game.state.restart(true, false, { level: this.level });
    }, this);
  }
};

PlayState._onHeroVsKey = function (hero, key) {
  this.sfx.key.play();
  key.kill();
  this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
  this.sfx.door.play();
  this.camera.fade();
  this.game.state.restart(true, false, { level: this.level + 1 });
  // this.camera.onFadeComplete.addOnce(function(){
  // }, this)
};

// load

window.onload = function () {
  var game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
  game.state.add('play', PlayState);
  game.state.start('play', true, false, { level: 0 });
};

},{"./characters/hero":1,"./characters/spider":2,"./gameloop/create":3,"./gameloop/init":4,"./gameloop/preload":5,"./gameloop/shutdown":6,"./gameloop/update":7}]},{},[8]);
