module.exports = function(){
  this._handleCollisions();
  this._handleInput();
  this.coinFont.text = `x${this.coinPickupCount}`;
  this.keyIcon.frame = this.hasKey ? 1 : 0;
};
