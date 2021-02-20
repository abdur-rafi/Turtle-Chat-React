import React from 'react'
import '../stylesheets/message.css'



function Item(props){
    let date = new Date(props.message.sent_at);
    let h = date.getHours() > 12 ? date.getHours()-12:date.getHours();
    let from_this_user = props.user.user_id===props.message.user_id;
    let next_message_time = props.next_message_sender ? new Date(props.next_message_time) : date;
    let show_date = !(date.getDate() === next_message_time.getDate() && date.getMonth() === next_message_time.getMonth());

    return(
        <div>
            <div className={ typeof(props.message.message_id)==='string'? "message-item sending":"message-item"} ref={props.lastMessage}>
                <div className="message-sender-image-container">
                    { props.selected.req === 2 && !from_this_user
                    && <img src={(props.next_message_sender !== props.message.user_id ?
                    "data:image/png;base64," + props.sender_image[props.message.user_id].image : null)} />}
                </div>
                <div  className={from_this_user ? "user-sender":null}>
                    
                    <div className={props.lastSeen ? null: "message-item-no-image"}>
                        {!from_this_user && props.selected.req === 2 &&
                            <div className={from_this_user ? "sender-name-user-sender" : "sender-name"}>
                                {props.message.username}
                            </div>}
                        {props.message.message}
                        <div id={from_this_user ?"sent-at-sender":"sent-at"}>
                            
                            { (h < 10 ? "0"+h : h) + ":" + (date.getMinutes() < 10 ? "0"+ date.getMinutes() : date.getMinutes())
                                + (date.getHours() > 12 ? ' pm' : ' am')}
                        </div>
                    </div>
                    <div className="senderimagediv">
                        {props.lastSeen && props.selected.req !== 2 ? <img src={"data:image/png;base64," + props.selected.image}/>:null} 
                    </div>
                    {/* <div>sd</div> */}
                </div>
            </div>
            {show_date && 
                <div className="message-date-container">
                    {next_message_time.getDate() + " " + next_message_time.toLocaleString('default',{month : "long"}) + " "
                     + next_message_time.getFullYear()} 
                </div>    
            }
        </div>
    )
}



class Message extends React.Component{
    constructor(props){
        super(props);
        this.lastMessage = React.createRef();
    }

    render(){
        

        let i = 0;
        let t = this.props.messages.map(message =>{ 
                ++i;
                let next_message_time = null;
                if(i < this.props.messages.length){
                    next_message_time = this.props.messages[i].sent_at;
                }
                return(
                    <Item user={this.props.user}
                    lastMessage={this.lastMessage} 
                    message={message} key={message.message_id} 
                    lastSeen={message.message_id===this.props.selected.lastseen?true:false}
                    selected={this.props.selected}
                    next_message_sender = {this.props.messages[i] ? this.props.messages[i].user_id : undefined}
                    sender_image = {this.props.members}
                    next_message_time = {next_message_time}
                    />
                )
            })
        
        return(
            <div className="messageList">
                {t}
                { this.props.typing &&   <div id="typingIndicator" >
                    {this.props.selected.group_user_name + " is typing..."}
                </div> }
            </div>
        )
    }
    scrollToBottom = () => {
        if(this.lastMessage.current)
            this.lastMessage.current.scrollIntoView();
    }
      
    componentDidMount() {
        this.scrollToBottom();
    }
      
    componentDidUpdate() {
        this.scrollToBottom();
    }
}



export default Message;