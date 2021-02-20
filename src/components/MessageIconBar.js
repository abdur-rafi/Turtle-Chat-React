import '../stylesheets/messageiconbar.css'
import {FaPhone,FaVideo} from 'react-icons/fa'
import {AiOutlineUserAdd} from 'react-icons/ai'
import {BiLogOutCircle} from 'react-icons/bi'
import {FaFacebookMessenger} from 'react-icons/fa'
import {BiPhoneCall} from 'react-icons/bi'
import {BsCameraVideo} from 'react-icons/bs'
import {FiUsers} from 'react-icons/fi'
import Modal from 'react-modal';
import { useState } from 'react';
import React from 'react';
import {useMediaQuery} from 'react-responsive'
let constants = require('../constants');
function MessageIconBar(props){

    Modal.setAppElement('.App');

    const is775px = useMediaQuery({
        maxDeviceWidth : 775
    })

    const is500px = useMediaQuery({
        maxDeviceWidth : 500
    })

    const [isOpen,setIsOpen] = useState(false);
    const [enableAddMemberButton,changeEnableAddMemberButton] = useState(true);
    const [selectedMembers,changeSelectedMembers] = useState([]);
    const [notification_id,changeNotification_id] = useState(undefined);
    const [isGroupMembersModalOpen,setIsGroupMembersModalOpen] = useState(false);

    let modalStyle = {
        top:"20vh",
        left:"25vw",
        right:"25vw",
        bottom:"20vh",
        backgroundColor:"transparent",
        padding : "0px"
    }
    if(is775px){
        modalStyle = {
            top:"15vh",
            left:"15vw",
            right:"15vw",
            bottom:"15vh",
            backgroundColor:"transparent",
            padding : "0px"
        }
    }


    function call(video=true) {
        if(!video){
            props.emitVideoCallRequest(props.selected,false);
            return;
        }
        props.emitVideoCallRequest(props.selected,true);
    }

    function GroupIconBar(){
        return(
            <div className="icons">
                <div className="message-icon-bar-icons-container" onClick={()=>setIsGroupMembersModalOpen(!isGroupMembersModalOpen)} title="Group Members">
                    <FiUsers className="message-icon-bar-icons"/>
                </div>
                <div onClick={()=>setIsOpen(!isOpen)} className="message-icon-bar-icons-container" title="Add Members">
                    <AiOutlineUserAdd className="message-icon-bar-icons" />
                </div>
                <div className="message-icon-bar-icons-container" title="Leave Group">
                    <BiLogOutCircle className="message-icon-bar-icons" />
                </div>
                
            </div>
        )
    }

    function RegularIconBar(){
        return(
            <div className="icons">
                <div className="message-icon-bar-icons-container" id="call" onClick={()=>call(false)} title="Voice call" >
                    <BiPhoneCall className="message-icon-bar-icons" />
                </div>
                <div className="message-icon-bar-icons-container" onClick={call} title="Video Call">
                    <BsCameraVideo className="message-icon-bar-icons" />
                </div>
            </div>
        );
    }

    function ListContactModal(){
        
        let notGroups = props.groups.filter(group=>{
            if(props.selected.req === 2){
                if(group.req === 2) return false;
                return !props.selected.group_members.some(member => member.user_id === group.name_user_id)
            }
            return false;
        });
        let items = notGroups.map(group => (
            <div key={group.name_user_id} onClick={()=>{
                if(notification_id){
                    props.removeNotification(notification_id);
                    changeNotification_id(undefined);
                }
                if(selectedMembers.some(member => group.group_id === member.group_id)){
                    changeSelectedMembers(selectedMembers.filter(member=>member.group_id !== group.group_id))
                }
                else{
                    changeSelectedMembers([...selectedMembers,group]);
                }
            }} 
            className={selectedMembers.some(member => group.group_id === member.group_id) ? 
            "member-contact-item selected-member":"member-contact-item" }>
                <div className = "member-img-container">
                    <img src={"data:image/png;base64,"+group.image} />
                </div>
                <div className="member-name-container">
                    {group.group_user_name}
                </div>
            </div>
        ))
        let selectedItems = selectedMembers.map(group=>(
                <div key={group.name_user_id} className="selected-members-item-container">
                    <div className="selected-members-item-image-container">
                        <img src={"data:image/png;base64," + group.image}/>
                    </div>
                    <div className="selected-members-item-name-container">
                        <div className="selected-members-item-name">
                            {group.group_user_name}
                        </div>
                    </div>
                </div>
        ));

        let addMemberOnClick = ()=>{
            if(selectedMembers.length === 0){
                let notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : "No New Members are Selected"
                }
                props.addNotification(notification);
                changeNotification_id(notification.notification_id);
                return;
            }
            let group_id = props.selected.group_id;
            changeSelectedMembers([]);
            changeEnableAddMemberButton(false);
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : "Processing Add Member request..."
            }
            setIsOpen(false);
            props.addNotification(notification);
            fetch(constants.url+'/groups/'+group_id+'/addmembers',{
                ...constants.postOption,
                body:JSON.stringify({
                    new_members : selectedMembers.map(item=>item.name_user_id)
                })
            }).then(resp =>{
                props.removeNotification(notification.notification_id);
                if(resp.status !== 200){
                    throw new Error("Failed to Add members, Error Code: " + resp.status);
                }
                return resp.json();
            }).then(data=>{
                let group_members = data['group_members'];
                props.updateGroupMembers(group_members,group_id);
            }).catch(err =>{
                notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : err.message
                }
                props.addNotification(notification);
            })
            .finally(()=>{
                changeEnableAddMemberButton(true);
            })
        }

        let resetButtonOnClick = ()=>{
            changeSelectedMembers([]);
        }

        return(
            <Modal isOpen={isOpen} style={{overlay:{
                zIndex:"4",
                backgroundColor:"rgba(255,255,255,.7)"
            },content: modalStyle
            }}  onRequestClose={()=>setIsOpen(false)}>
                <div className="add-member-modal">
                    <div className="title">Add Members</div>
                    <div className="selected-members-list-container">
                        {selectedItems}
                    </div>
                    <div className="member-contact-list">
                        {items}
                    </div>
                    <div className="add-member-modal-button-container">
                        <button disabled={!enableAddMemberButton} onClick={addMemberOnClick}>Confirm</button>
                        <button onClick={resetButtonOnClick}>Reset</button>
                    </div>
                </div>
            </Modal>
        )
        
    }

    function ListGroupMembers(){


        let onMessageIconClick = (user_id,username,image) =>{
            setIsGroupMembersModalOpen(false);
            let group = {
                group_id : "request"+user_id,
                group_name : null,
                group_user_name : username,
                image: image,
                name_user_id:user_id,
                last_time : Date.now(),
                unseenCount : 0
            }
            props.addRequestGroup(group);
        }

        let items = props.selected.group_members.map(member=>{
            return(
                <div className="user-item" key={member.user_id}>
                    <img src={"data:image/png;base64,"+member.image} />
                    <div>
                        <div>{member.username}</div>
                       { member.user_id !== props.user.user_id &&
                        <div onClick={()=>onMessageIconClick(member.user_id,member.username,member.image)} title="Message">
                            <FaFacebookMessenger className="message-icon"/>
                        </div>}
                    </div>
                </div>
            )
        })

        return(
            <Modal isOpen={isGroupMembersModalOpen} style={{overlay:{
                zIndex:"4",
                backgroundColor:"rgba(255,255,255,.7)"
            },content:modalStyle
            }}  onRequestClose={()=>setIsGroupMembersModalOpen(false)}>
                <div className="group-member-modal ">
                    <div className="title">
                        Group Members
                    </div>
                    {items}
                </div>
            </Modal>
        )
    }
    
    if(props.selected.group_id === -1) return <div></div>;
    return(
        <div className={ props.selected.group_id !==-1?"container":null}>
            <div className="name-image">
                <img src={"data:image/png;base64," + props.selected.image} />
                <div> {props.selected.group_user_name} </div>
            </div>
            { props.selected.req === 2 && <ListContactModal />}
            {props.selected.req === 2 && <ListGroupMembers />  }
            
            { props.selected.req === 2 ? <GroupIconBar/> : <RegularIconBar />}
        </div>
    )
}

export default MessageIconBar;