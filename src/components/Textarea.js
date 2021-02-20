import TextareaAutosize from 'react-textarea-autosize';
import React from 'react'
import {FiSend} from 'react-icons/fi'
import {VscSmiley} from 'react-icons/vsc'
import  EmojiPicker from './EmojiPicker'
var constants = require('../constants');
let sent = 0;

class Textarea extends React.Component{
    constructor(props){
        super(props);
        this.state = {value:"", disableSend : false,showEmojiPicker : false,emojiPickerOffset : {
            x : null,
            y : null,
            x1 : null,
            y1 : null
        }}
        this.onType = this.onType.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendOnEnter = this.sendOnEnter.bind(this);
        this.emojiIconRef = React.createRef();
        this.appendEmoji = this.appendEmoji.bind(this);
    }

    componentDidMount(){
        if(this.emojiIconRef.current){
            let box = this.emojiIconRef.current.getBoundingClientRect();
            this.setState({
                emojiPickerOffset : {
                    x : box.left ,
                    y : box.top,
                    x1 : window.innerWidth - box.left,
                    y1 : window.innerHeight - box.top
                }
            })
        }
        window.addEventListener("resize",()=>{
            // console.log("resize event")
            if(this.emojiIconRef.current){
                console.log("resize event")
                
                let boundingBox = this.emojiIconRef.current.getBoundingClientRect();
                this.setState({
                    emojiPickerOffset : {x : boundingBox.left, y : boundingBox.top,
                        x1 : window.innerWidth - boundingBox.left , y1 : window.innerHeight - boundingBox.top }
                })
            }
        })
    }

    onType(event){
        if(event.target.value !== this.state.value){
            this.props.sendTypingEvent(this.props.selected);
        }
        this.setState({value:event.target.value})
    }

    sendMessage(){
        if(this.state.value.trim() === ''){
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : 'Message body is empty'
            }
            this.props.addNotification(notification);
            return;
        }
        if(typeof(this.props.selected) === 'string' && this.props.selected.substring(0,7) === 'request' && this.state.disableSend){
            return;
        }
        let notification = {};
        if(typeof(this.props.selected) === 'string' && this.props.selected.substring(0,7) === 'request'){
            this.setState({disableSend : true});
            notification['notification_id'] = ++constants.notification_id['count'];
            notification['message'] = 'Sending Message Request...'; 
            this.props.addNotification(notification);
        }
        var head = new Headers();
        head.append('Content-Type','application/json');
        let message = {
            message:this.state.value,
            group_id:this.props.selected,
            user_id:this.props.user.user_id,
            username:this.props.user.username,
            message_id:"sending-"+sent++,
            sent_at : new Date().toString()
        }

        if(this.props.inputRef  && this.props.inputRef.current ){
            this.props.inputRef.current.focus();
        }
        
        this.props.addMessage(message);
        let postOption = {method:"post",credentials:"include",mode:"cors",cache:"default",
            headers:head,body:JSON.stringify({message:this.state.value,sendingId:message.message_id})}
        fetch(constants.url+'/groups/'+this.props.selected,postOption)
        .then(resp=>{
            if(resp.status !== 200) throw new Error("error sending message");
            else return resp.json()
        }).then(data=>{
            if(data.request){
                this.props.modifyRequestGroup(data.group_id,data.request);
                this.setState({disableSend : false});
                if(notification['notification_id']){
                    this.props.removeNotification(notification['notification_id']);
                }
            }
            this.props.modifyMessage(data);
        })
        .catch(err=>{
            let notification = {
                notification_id : constants.notification_id['count'],
                message : err.message 
            }
            this.props.addNotification(notification);
        })
        this.setState({value:""})
    }
    
    sendOnEnter(e){
        if(typeof(this.props.selected) === 'string' && this.props.selected.substring(0,7) === 'request' && this.state.disableSend){
            return;
        }
        if(e.shiftKey) return;
        if(e.code === "Enter" && this.state.value.trim() !== ''){
            e.preventDefault();
            this.sendMessage();
        }
    }

    appendEmoji(emoji){
        this.setState(old=>({
            value : old.value + emoji
        }))
    }

    render(){
        
        let smileyOnClick = (e)=>{
            this.setState(old =>({
                showEmojiPicker : !old.showEmojiPicker
            }))
        }
        return(
            <div className="textarea-div">
                <div>
                    <TextareaAutosize maxRows="6" onKeyPress={this.sendOnEnter} minRows="1" 
                    value={this.state.value} onChange={this.onType} placeholder="Enter Message"
                    autoFocus={true} 
                    ref={this.props.inputRef}
                    onFocus={()=>this.setState({showEmojiPicker : false})}
                     />
                    <div className="emoji-picker-trigger">
                        <div ref={this.emojiIconRef}>
                            <VscSmiley className={"smiley-icon " + (this.state.showEmojiPicker ? "smiley-icon-clicked": "")}
                                onMouseEnter={()=>{this.setState({showEmojiPicker : true})}}
                                onMouseLeave = {()=>this.setState({showEmojiPicker : false})}
                                 />
                        </div>
                        <div onMouseEnter={()=>this.setState({showEmojiPicker : true})}
                             onMouseLeave = {()=>this.setState({showEmojiPicker : false})}
                        >
                            <EmojiPicker top={this.state.emojiPickerOffset.y} left={this.state.emojiPickerOffset.x} 
                                right = {this.state.emojiPickerOffset.x1 - 10} bottom={this.state.emojiPickerOffset.y1 - 10}
                                display={this.state.showEmojiPicker ? "block":"none"}
                                appendEmoji = {this.appendEmoji} 
                                
                                /> 
                        </div>
                           
                    </div>
                    <div id="sendIcon">
                        <FiSend onClick={this.sendMessage} title="send" />
                    </div>
                </div>
            </div>
        )
    }
}

export default Textarea;