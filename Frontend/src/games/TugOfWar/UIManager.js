export default class UIManager{

constructor(scene){

this.scene = scene

}

showWinner(text){

this.scene.add.text(
this.scene.scale.width/2,
200,
text,
{fontSize:"64px",color:"#fff"}
).setOrigin(0.5)

}

}