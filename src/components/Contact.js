import React from 'react';
import { CgClose } from "react-icons/cg";
import {useMediaQuery} from 'react-responsive'
import '../stylesheets/contact.css'
function Item(props){
    const is800px = useMediaQuery({
        maxDeviceWidth : 650
    })
    var split = (!is800px || (props.selected.group_id === -1 && props.searchUser === false ));
    let lastSender = props.group.last_message_user_id ? props.group_members[props.group.last_message_user_id].username : null;
    let date = new Date(props.group.last_time);
    let h = date.getHours();
    h = date.getHours() > 12 ? h-12 : h;
    h = h < 10 ? "0" + h : ""+h;
    let m = date.getMinutes();
    m = m < 10 ? "0"+m : ""+m;
    let median = date.getHours() >= 12 ? "pm" : "am";
    let dateString = h + ":"+m + " " + median;
    return (
        <div className={props.selected.group_id===props.group.group_id?"selected item-container":"item-container"}>
            <div className={split ?"contact-item":"contact-item contact-item-split"} 
            onClick={()=>props.onSelect(props.group)}>
                <div>{props.group.active?<div className={split?"active-dot":"active-dot active-dot-split"}></div>:null}  <img src={"data:image/png;base64," + props.group.image} /></div>
                { (split) &&
                    <div>
                    <div>
                        <div className="contact-item-name-container">
                            {props.group.group_user_name} 
                            { date &&  <div className="contact-item-time-container"> 
                                {dateString} 
                            </div> }
                        </div>
                        {props.group.message && <div className={ props.group.bold?"lastMessage notseen":"lastMessage"}>{lastSender+": "+props.group.message}</div>}
                    </div>
                </div>}
            </div>
            {typeof(props.group.group_id)==='string'?<div><CgClose onClick={()=>props.removeGroup(props.group.group_id)} /></div>:null}  

        </div>
    )
}


function Contact(props){

    const is800px = useMediaQuery({
        maxDeviceWidth : 650
    })

    let t = props.groups.map(group=><Item removeGroup={props.removeGroup}
    group={group} onSelect={props.onSelect} key={group.group_id}
    selected={props.selected} user={props.user} group_members = {props.members}    
    searchUser = {props.searchUser}
        />);
        
    return(
        <div className={"contactList " + (is800px && props.selected.group_id !== -1 ? "contactList-split" : "") }>
            {t} 
        </div>
        
        
    );
    
}

export default Contact;