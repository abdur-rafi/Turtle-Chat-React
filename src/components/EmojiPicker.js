
import '../stylesheets/EmojiPicker.css'

function EmojiPicker(props){
    
    let emojiCode = [];
    for(let i = 0; i < 5; ++i){
        for(let j = 0; j < 10; ++j){
            emojiCode.push("0x1F6" + i + j)
        }
        emojiCode.push("0x1F6" + i + "A");
        emojiCode.push("0x1F6" + i + "B");
        emojiCode.push("0x1F6" + i + "C");
        emojiCode.push("0x1F6" + i + "D");
        emojiCode.push("0x1F6" + i + "E");
        emojiCode.push("0x1F6" + i + "F");
    }
    for(let i = 1; i < 4; ++i){
        for(let j = 0; j < 10; ++j){
            emojiCode.push("0x1F9" + i + j);
            if(i === 3 && j === 7) break;
        }
        if(i === 3) break;
        emojiCode.push("0x1F9" + i + "A");
        emojiCode.push("0x1F9" + i + "B");
        emojiCode.push("0x1F9" + i + "C");
        emojiCode.push("0x1F9" + i + "D");
        emojiCode.push("0x1F9" + i + "E");
        emojiCode.push("0x1F9" + i + "F");
    }


    let items = emojiCode.map(code => {

        let itemOnClick = ()=>{
            props.appendEmoji( String.fromCodePoint(code));
        }

        return(
            <div onClick={itemOnClick} className="emoji-item" key={code} style={{display:"inline"}} >
                <div >
                <button className="emoji-item-button"  style={{border:"none",padding:"0px",margin:"0px",fontSize:"1em",backgroundColor:"transparent",outline:"none"}}>
                    { String.fromCodePoint(code) }
                </button>
                </div>
            </div>
        )
    })

    return(
        <div className="emoji-picker-container" style={{
            right : props.right,
            bottom : props.bottom,
            display:props.display}}>
        <div className="emoji-picker-title"> EMOJI </div>
            {items}
        </div>
    )
}

export default EmojiPicker;