const init = require('./gameloop/init');
const preload = require('./gameloop/preload');
const create = require('./gameloop/create');
const update = require('./gameloop/update');
const shutdown = require('./gameloop/shutdown');
const Hero = require('./characters/hero');
const Spider = require('./characters/spider');

const PlayState = {
  init,
  preload,
  create,
  update,
  shutdown
};

// Playstate functions

PlayState._loadLevel = function(data) {
  this.bgDecoration = this.game.add.group();
  this.platforms = this.game.add.group();
  this.coins = this.game.add.group();
  this.spiders = this.game.add.group();
  this.enemyWalls = this.game.add.group();
  this.enemyWalls.visible = false;

  data.platforms.forEach(this._spawnPlatform, this);
  data.decoration.forEach(this._spawnDecor, this);

  this._spawnCharacters({hero: data.hero, spiders: data.spiders});
  this._spawnDoor(data.door.x, data.door.y);

  if(data.doorBoxes){
    this._spawnPullDoor(data.doorBoxes, data.doorSwitch);
  }

  if(data.water){
    this._spawnWater(data.water.x, data.water.y);
  }

  this._spawnKey(data.key.x, data.key.y);

  data.coins.forEach(this._spawnCoin, this);

  const GRAVITY = 1200;
  this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._createHud = function () {
  this.keyIcon = this.game.make.image(0, 19, 'icon:key');
  this.keyIcon.anchor.set(0, 0.5);

  const coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
  const NUMBERS_STR = '0123456789X ';

  this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

  let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
  coinScoreImg.anchor.set(0, 0.5);


  this.hud = this.game.add.group();
  this.hud.position.set(10, 10);
  this.hud.add(coinIcon);
  this.hud.add(coinScoreImg);
  this.hud.add(this.keyIcon);
};

PlayState._handleCollisions = function () {
  this.game.physics.arcade.collide(this.hero, this.platforms);
  this.game.physics.arcade.collide(this.hero, this.pullDoor);
  this.game.physics.arcade.collide(this.hero, this.water, function(){
    this.hero.die();
    this.hero.events.onKilled.addOnce(function () {
      this.game.state.restart(true, false, {level: this.level});
    }, this);
  }, null, this);
  this.game.physics.arcade.collide(this.platforms, this.water);
  this.game.physics.arcade.collide(this.pullDoor, this.platforms);
  this.game.physics.arcade.collide(this.spiders, this.platforms);
  this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
  this.game.physics.arcade.collide(this.spiders, this.pullDoor);

  this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
  this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
  this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this)
  this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
    // ignore if there is no key or the player is on air
    function (hero, door) {
        return this.hasKey && hero.body.touching.down;
    }, this);
    this.game.physics.arcade.overlap(this.hero, this.doorSwitch, this._onHeroVsSwitch, null, this);
};

PlayState._handleInput = function () {
  if (this.keys.left.isDown) { // move hero left
    this.hero.move(-1);
  }
  else if (this.keys.right.isDown) { // move hero right
    this.hero.move(1);
  }
  else { // stop
    this.hero.move(0);
  }
};

PlayState._spawnWater = function (x, y) {
  this.water = this.bgDecoration.create(x, y, 'water');

  this.game.physics.enable(this.water);
  this.pullDoor.body.immovable = true;
  this.pullDoor.body.allowGravity = false;
};

PlayState._spawnPullDoor = function (door, doorSwitch) {
  this.pullDoor = this.bgDecoration.create(door.x, door.y, 'boxes');
  this.game.physics.enable(this.pullDoor);
  this.pullDoor.body.immovable = true;
  this.pullDoor.body.allowGravity = false;

  this.doorSwitch = this.bgDecoration.create(doorSwitch.x, doorSwitch.y, 'doorSwitch', 0);
  this.doorSwitch.animations.add('pull', [1], 1);
  this.game.physics.enable(this.doorSwitch);
  this.doorSwitch.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
  this.door = this.bgDecoration.create(x, y, 'door');
  this.door.anchor.setTo(0.5, 1);
  this.game.physics.enable(this.door);
  this.door.body.allowGravity = false;
};

PlayState._spawnDecor = function (decor) {
  this.bgDecoration.create(decor.x, decor.y, 'decoration', decor.frame);
}

PlayState._spawnKey = function (x, y) {
  this.key = this.bgDecoration.create(x, y, 'key');
  this.key.anchor.set(0.5, 0.5);
  this.game.physics.enable(this.key);
  this.key.body.allowGravity = false;

  this.key.y -= 3;
  this.game.add.tween(this.key)
      .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .loop()
      .start();
};

PlayState._spawnPlatform = function (platform) {
  const sprite = this.platforms.create(platform.x, platform.y, platform.image);

  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
  sprite.body.immovable = true;

  this._spawnEnemyWall(platform.x, platform.y, 'left');
  this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
  let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
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
    const sprite = new Spider(this.game, spider.x, spider.y);
    this.spiders.add(sprite);
  }, this);
};

PlayState._spawnCoin = function (coin) {
  const sprite = this.coins.create(coin.x, coin.y, 'coin');
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
  if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
    hero.bounce();
    enemy.die();
    this.sfx.stomp.play();
  } else {
    hero.die();
    this.sfx.stomp.play();
    hero.events.onKilled.addOnce(function () {
      this.game.state.restart(true, false, {level: this.level});
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
  this.camera.fade()
  this.game.state.restart(true, false, {level: this.level + 1});
  // this.camera.onFadeComplete.addOnce(function(){
  // }, this)
};

PlayState._onHeroVsSwitch = function (hero, doorSwitch) {
    this.keys.action.onDown.add(function(){
      this.sfx.door.play();

      doorSwitch.animations.play('pull')
      this.pullDoor.kill();
      // this.game.physics.disable(doorSwitch)
      // doorSwitch.activated = true;
    }, this)
};

// load

window.onload = function () {
  let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game')
  game.state.add('play', PlayState)
  game.state.start('play', true, false, {level: 0});
};
