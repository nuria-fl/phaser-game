module.exports = function (data) {
  const LEVEL_COUNT = 3;

  this.keys = this.game.input.keyboard.addKeys({
    left: Phaser.KeyCode.LEFT,
    right: Phaser.KeyCode.RIGHT,
    up: Phaser.KeyCode.UP,
    action: Phaser.KeyCode.SPACEBAR
  });
  this.keys.up.onDown.add(function () {
    let didJump = this.hero.jump();
    if (didJump) {
      this.sfx.jump.play();
    }
  }, this);

  this.level = (data.level || 0) % LEVEL_COUNT;
  this.coinPickupCount = 0;
  this.hasKey = false;
  this.game.renderer.renderSession.roundPixels = true;
};
