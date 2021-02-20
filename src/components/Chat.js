import React from 'react';
import socketIOClient from "socket.io-client";
import Contact from './Contact';
import Message from './Message';
import '../stylesheets/chat.css'
import SearchUsers from './SearchUsers';
import IconBar from './IconBar'
import MediaQuery,{useMediaQuery} from 'react-responsive'
import MessageIconBar from './MessageIconBar';
import Modal from 'react-modal';
import {FaPhone,FaAngleUp} from 'react-icons/fa'
import { CgClose } from "react-icons/cg";
import Draggable from 'react-draggable';
import Textarea from "./Textarea";
var constants = require('../constants');
const SOCKET_ENDPOINT = constants.url;
let socket; 
let configuration2 = {
    iceServers: [{   urls: [ "stun:bn-turn1.xirsys.com" ]}, 
    {   username: "tdKO-ViLqgEtjyAVQVjHNNDK9vfEDxVdezsDMV3i5a03m2K5M2Lg4oK8ZICcdRODAAAAAF_gjDlBYmR1clJhZmk=",   credential: "d84b0916-4382-11eb-8bb0-0242ac140004",   urls: [       "turn:bn-turn1.xirsys.com:80?transport=udp",       "turn:bn-turn1.xirsys.com:3478?transport=udp",       "turn:bn-turn1.xirsys.com:80?transport=tcp",       "turn:bn-turn1.xirsys.com:3478?transport=tcp",       "turns:bn-turn1.xirsys.com:443?transport=tcp",       "turns:bn-turn1.xirsys.com:5349?transport=tcp"   ]}]
}

function SplitPane(props){
    const is800px = useMediaQuery({
        maxDeviceWidth : 650
    })
    const videoIcons=
        <div className="floating-video-icons">
            <div className="upper-arrow">
                <FaAngleUp onClick={props.openModal}/>
            </div>
        </div>
    return(
        <div className="splitpane" id= "gradient-div">
            { props.isInCall && <div className="call-short" onClick={props.openModal}><FaPhone/></div>}
            
            {props.isInCall && !props.isModalOpen && <Draggable bounds="parent" >
            <div className="floating-video">
                <video autoPlay ref={video => {if(video) video.srcObject=props.stream}}></video>
                <div className="floating-video-icons-position">{videoIcons}</div>
            </div></Draggable>}
            
            {props.modal}
            <div className={ (props.selected.group_id === -1 && props.searchUser === false )  ? "left" : "left left-split"} >
                <div>{props.iconbar}</div>
                <div>{props.left}</div>
            </div>
            { (!is800px || props.selected.group_id !== -1 || props.searchUser) &&
            <div className={props.selected.group_id === -1 ? "right" : "right right-split"}>
                <div >
                    <div> {props.rightup} </div>
                    <div  >{props.right}</div>
                    <div>{props.rightBottom}</div>
                    {props.responseToRequest}
                </div>
                
            </div>}

            { props.notifications.length !== 0 && 
            <NotificationPanel removeNotification={props.removeNotification} notifications = {props.notifications}/>}
        </div>
    )
}

function NotificationPanel(props){
    let t = props.notifications.map(noti=>{
        return (
            <div className="notification-container" key={noti.notification_id} >
                <div>
                    {noti.message}
                </div>
                <CgClose className="notification-cross-icon" onClick={()=>{
                    props.removeNotification(noti.notification_id);
                }}/>
            </div>
        );
    })
    return(
        <div className="notification-bar">
            {t}
        </div>
    )
}

function ResponseToRequest(props){
    let t = <div >
                Accept message request?
                <div><button onClick={props.addRequestInProcess}>Accept</button><button>Cancel</button></div>
            </div>;
    return(
        <div className="accept">
            <div className="acceptText">
                {props.requestsInProcess?null:t}
            </div>
        </div>
    )
}

function  ModalComp(props) {
    let x = props.isCaller? props.receiver.image:props.caller.image ; 
    return(
    <Modal isOpen={props.isModalOpen} style={{overlay:{
        zIndex:"4"
    },content:{
        top:"15vh",
        left:"30vw",
        right:"20vw",
        bottom:"15vh",
        backgroundColor:"transparent"
    }
    }}  onRequestClose={props.closeModal}>
        <div className="modal-container">
            { !props.stream && <div className="image-name-container">
                <div><img src={"data:image/png;base64," + x } /></div>
                <div className="name">{props.isCaller? props.receiver.group_user_name:props.caller.group_user_name}</div>
                <div className="calling">{props.isCaller? "Calling...":"is Calling"}</div>
                <div className="calling"> {props.callType + " Call"} </div>
            </div>}
            {props.stream && <video autoPlay ref={video=>{if(video) video.srcObject=props.stream}} />}
            <div className="modal-icons">
                {!props.isCaller && !props.stream &&
                    <div onClick={props.acceptCall} className="close-call accept-call">
                        <FaPhone />
                    </div>
                }
                <div onClick={props.closeCall} className="close-call">
                    <FaPhone />
                </div>
                
            </div>
        </div>
    </Modal>
    )
}

class Chat extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            groups : [],
            selectedContact : {group_id:-1},
            searchUser:false,
            showRequests:false,
            requests:[],
            requestsInProcess:[],
            isModalOpen:false,
            stream:null,
            isInCall:false,
            isCaller:false,
            caller:{},
            receiver:{},
            user:{},
            mediaStream:null,
            myStream:null,
            typing : false,
            callType : undefined,
            members : {},
            notifications : [],
            activeUsers : [],
            isShowActive : false
            
        }
        this.changeSelected = this.changeSelected.bind(this);
        this.changeSearchUser = this.changeSearchUser.bind(this);
        this.addRequestGroup = this.addRequestGroup.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
        this.addGroup = this.addGroup.bind(this);
        this.updateGroupMembers = this.updateGroupMembers.bind(this);
        this.modifyRequestGroup = this.modifyRequestGroup.bind(this);
        this.changeshowRequests = this.changeshowRequests.bind(this);
        this.addRequestInProcess = this.addRequestInProcess.bind(this);
        this.addMessage = this.addMessage.bind(this);
        this.modifyMessage = this.modifyMessage.bind(this);
        this.updateSeen = this.updateSeen.bind(this);
        this.updateActive = this.updateActive.bind(this);
        this.updateInactive = this.updateInactive.bind(this);
        this.emitVideoCallRequest = this.emitVideoCallRequest.bind(this);
        this.showCallRequest = this.showCallRequest.bind(this);
        this.acceptCall = this.acceptCall.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeCall = this.closeCall.bind(this);
        this.answerRTCOffer = this.answerRTCOffer.bind(this);
        this.clearUp = this.clearUp.bind(this);
        this.sendTypingEvent = this.sendTypingEvent.bind(this);
        this.addNotification = this.addNotification.bind(this);
        this.removeNotification = this.removeNotification.bind(this);
        this.clearNotificationType = this.clearNotificationType.bind(this);
        this.activeUsersFilter = this.activeUsersFilter.bind(this);
        this.setIsShowActive = this.setIsShowActive.bind(this);
        this.callMediaConnection = null;
        this.peerConnection = null;
        this.inputRef = React.createRef();
        this.typingEventFlag = false;
        constants.notification_id['count'] = 0;
    }

    setIsShowActive(value){
        this.setState({
            isShowActive : value
        })
    }

    activeUsersFilter(){
        this.setState(old=>({
            selectedContact : {group_id : -1},
            activeUsers : old.groups.filter(group=> group.active)
        }));

    }

    addNotification(notification){
        this.setState(old=>({notifications : [...old.notifications,notification]}))
    }
    removeNotification(notification_id){
        this.setState(old=>({notifications : old.notifications.filter(noti=>noti.notification_id !== notification_id)}))
    }
    clearNotificationType(type){
        this.setState(old=>({
            notifications : old.notifications.filter(noti => noti.type !== type)
        }))
    }

    updateMembers(groups){
        let members = {}
        groups.forEach(group=>{
            if(group.req === 2){
                group.group_members.forEach(member => {
                    members[member.user_id] = {
                        username: member.username,
                        image : member.image
                    }
                })
            }
            else{
                members[group.name_user_id] = {
                    username : group.group_user_name,
                    image : group.image
                };
            }
        })
        this.setState(old=>({
            members : {
                ...members,
                ...old.members
            }
        }))
    }

    componentDidMount(){
        this.updateMembers(this.state.groups);
        socket = socketIOClient(SOCKET_ENDPOINT)
        socket.on('new-message',data=>{
            this.addMessage(data,true);
            if(this.state.selectedContact.group_id === data.group_id){
                socket.emit('message-seen',{group_id:this.state.selectedContact.group_id});
            }
            this.updateSeen({group_id:data.group_id,lastSeen:data.message_id})
        })
        socket.on('new-request',data=>{
            this.updateMembers([data]);
            this.setState(old=>({requests:[data,...old.requests]}))
        });
        socket.on('update-seen',data=>this.updateSeen(data));
        socket.on('new-active',(data)=>this.updateActive(data));
        socket.on('new-inactive',(data)=>this.updateInactive(data));
        socket.on('typing',data=>{
            if(data.group_id === this.state.selectedContact.group_id){
                if(!this.state.typing){
                    this.setState({typing : true});
                    setTimeout(()=>this.setState({typing : false}),2000);
                }
            }
        });
        socket.on('close-call',data=>{
            if(this.state.isCaller){
                if(data.sender === this.state.receiver.name_user_id){
                    this.clearUp();
                }
            }
            else{
                if(data.sender === this.state.caller.name_user_id) 
                    this.clearUp()
            }
        })
        socket.on('icecandidate',data=>{
            if(data.candidate && this.peerConnection){
                this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .then(()=>{},err=>{
                    console.log(err);
                })
            }
        })
        socket.on('answer',(data)=>{
            let remoteDesc = new RTCSessionDescription(data.answer);
            this.peerConnection.setRemoteDescription(remoteDesc).then(()=>{});
        })
        socket.on('offer',data=>{
            if(this.state.isInCall) return;
           this.showCallRequest(data); 
        })
        socket.on('update-group-members',data=>{
            this.updateGroupMembers(data.group_members,data.group_id);
        })
        let notification = {notification_id : ++constants.notification_id['count'],message:"Fetching Groups..",type : "fetching_groups"}
        this.addNotification(notification);
        fetch(constants.url+'/groups',constants.getOptions)
        .then(resp => {
            this.removeNotification(notification.notification_id);
            if(resp.status !== 200){
                throw new Error("Failed to Fetch Groups, Error code: " + resp.status);
            }
            return resp.json()
        }).then(data =>{
            let members = {};
            members[data.user.user_id] = {
                username : data.user.username,
                image : data.user.image
            };
            this.setState(old =>({
                members : {
                    ...old.members,
                    ...members
                }
            }))
            this.updateMembers(data.groups);
            this.setState(old=>({
            groups : data.groups,
            user: data.user
        }))})
        .catch(err=>{
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : err.message,
                type : "fetching_groups"
            }
            this.addNotification(notification);
        })
        
        let notification_requests = {
            notification_id : ++constants.notification_id['count'],
            message : "Fetching Requests..."
        }
        this.addNotification(notification_requests);
        
        fetch(constants.url+'/requests',constants.getOptions)
        .then(resp =>{
            this.removeNotification(notification_requests.notification_id);
            if(resp.status !== 200){
                throw new Error("Failed to Fetch Requests. Error Code: "+resp.status);
            }
            return resp.json()
        }).then(data =>{
            this.updateMembers(data);
            this.setState({requests:data})
        })
        .catch(err=>{
            notification_requests = {
                notification_id : ++constants.notification_id['count'],
                message : err.message
            }
            this.addNotification(notification_requests);

        })
        socket.on('new-group',(data)=>{
            this.updateMembers([data]);
            this.addGroup(data);
        })
        socket.on('disconnect',reason=>{
            let notification = {
                notification_id : ++constants.notification_id['count'],
                type : "disconnected"
            }
            // this.props.setLogStatus("error");
            if(reason === 'io server disconnect'){
                notification['message'] = "Failed to connect to server; Server could be down";
            }
            else if(reason === 'transport close'){
                notification['message'] = "Connection lost. Please check your internet connection";
            }
            else{
                notification['message'] = 'Connection lost. Unknown Error Occurred';
                // this.props.setErrorMessage("Unknown Error occurred");
            }
            this.addNotification(notification);
        })
        socket.on('reconnect_attempt',(attempt)=>{
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : "attemptimg to reconnect",
                type : "reconnection_attempt"
            }
            this.addNotification(notification);
        })
        socket.on('reconnect',(attempt)=>{
            let notification = {
                notification_id  : ++constants.notification_id['count'],
                message : "Connection Established, Refreshing...",
                type : "reconnect"
            }
            setTimeout(()=>{
                window.location.reload();
            },1500);
            this.clearNotificationType("disconnected");
            this.clearNotificationType("reconnection_attempt");
            this.addNotification(notification);
        })
        socket.on('new-login-detected',(data)=>{
            if(data.user_id === this.state.user.user_id){
                this.props.setErrorMessage("Another Login Detected");
                this.props.setLogStatus("error");
                socket.close();
            }
        })
    }

    sendTypingEvent(group_id){
        if(this.typingEventFlag) return;
        this.typingEventFlag = true;
        setTimeout(()=>{
            this.typingEventFlag = false;
        },1000);
        socket.emit('typing',{group_id:group_id});
    }

    addRequestInProcess(){
        this.setState(old=>{
            return ({requestsInProcess : [...old.requestsInProcess,old.selectedContact.group_id]})
        })
        let notification = {
            notification_id : ++constants.notification_id['count'],
            message : "Processing request...",
            type : "request"
        }
        this.addNotification(notification);
        fetch(constants.url+'/requests/accept/'+this.state.selectedContact.group_id,constants.postOption)
        .then(resp=>{
            this.removeNotification(notification.notification_id);
            if(resp.status === 200){
                return resp.json();
            }
            throw new Error("Failed to process request. status code: " + resp.status);
        }).then(data=>{
            this.setState(old=>{
                let group = old.requests.filter(request=>request.group_id===data.group_id);
                let selected = old.selectedContact.group_id;
                if(selected === data.group_id) selected = -1;
                group[0]["active"] = data.active;
                return({
                    requests : old.requests.filter(request=>request.group_id!==data.group_id),
                    groups : [...group,...old.groups],
                    requestsInProcess : old.requestsInProcess.filter(request=>request !== data.group_id),
                    showRequests : old.selectedContact.group_id === data.group_id ? false:old.showRequests
                })
            })
        })
        .catch(err=>{
            notification = {
                notification_id : ++constants.notification_id['count'],
                message : err.message   
            }
            this.addNotification(notification);
        })
    }

    changeshowRequests(state){
        this.setState({showRequests : state,selectedContact:{group_id:-1}});
        
    }

    showCallRequest(data){
        this.offerData = data;
        // this.acceptCall();
        let id = -1;
        for(let i = 0; i < this.state.groups.length;++i){
            if(this.state.groups[i].name_user_id === data.sender){
                id = i;
                break;
            }
        }
        if(id === -1) return;
        this.setState({isModalOpen : true,caller:{...this.state.groups[id]},
        receiver:{...this.state.user},isInCall:true,callType:data.video ? "Video": "Audio"});
    }
    async emitVideoCallRequest(group,video=true){
        if(this.state.isInCall) return;
        this.setState({isInCall:true,isCaller:true,caller:this.state.user,receiver:group,isModalOpen:true,
            callType : video ? "Video" : "Audio"});
        this.peerConnection = new RTCPeerConnection(configuration2);
        let mediaConfig = {audio : true};
        if(video){
            mediaConfig = {
                ...mediaConfig,
                video:{
                    width:{
                        ideal : 400
                    }
                }
            }
        }
        try{
            let stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
            this.setState({myStream:stream});
            stream.getTracks().forEach(track=>{this.peerConnection.addTrack(track,stream)});
            this.peerConnection.addEventListener('icecandidateerror',(err)=>{
                console.log("ice candidate error, ",err,"ice candidate error end");
            })
            let remoteStream = new MediaStream();
            this.peerConnection.addEventListener('track',event=>{
                remoteStream.addTrack(event.track,remoteStream);
                this.setState({stream:remoteStream})
            })
            this.peerConnection.addEventListener('icecandidate',e=>{
                if(e.candidate){
                    socket.emit('icecandidate',{receiver:this.state.selectedContact.name_user_id,candidate:e.candidate});
                }
            })
            this.peerConnection.addEventListener('negotiationneeded',()=>{
                console.log("negotiation needed");
            })
            this.peerConnection.addEventListener('connectionstatechange',e=>{
                if(this.peerConnection.connectionState === 'connected'){
                    console.log("peerConnection established");
                }
            })
            this.peerConnection.createOffer().then(offer=>{
                this.peerConnection.setLocalDescription(offer).
                then((a)=>{
                    let offerConfig = {offer:offer,receiver:this.state.selectedContact.name_user_id,video:true};
                    if(!video){
                        offerConfig = {
                            ...offerConfig,
                            video : false
                        }
                    }
                    socket.emit('offer',offerConfig);
                }).catch(err=>console.log(err));
            })
        } catch(err){
            this.clearUp();
        }
        
        
    }

    acceptCall(){
        this.answerRTCOffer(this.offerData);
        
    }

    
    closeCall(){
        if(this.state.isCaller){
            socket.emit('close-call',{receiver:this.state.receiver.name_user_id})
        }
        else{
            socket.emit('close-call',{receiver:this.state.caller.name_user_id})
        }
        if(this.peerConnection){
            this.peerConnection.close();
        }
        this.peerConnection = null;
        this.clearUp();
    }

    openModal(e){
        this.setState({isModalOpen:true})
    }

    closeModal(e){
        e.stopPropagation();
        this.setState({isModalOpen:false});
    }

    async answerRTCOffer(data){
        let remoteStream = new MediaStream();
        this.peerConnection = new RTCPeerConnection(configuration2);
        let mediaCOnfig = {audio : true}
        if(data.video) mediaCOnfig = {...mediaCOnfig,video:{width:{ideal:400}}};
        let stream = await navigator.mediaDevices.getUserMedia(mediaCOnfig);
        this.setState({myStream:stream});
        stream.getTracks().forEach(track=>{
            this.peerConnection.addTrack(track,stream);
        })
        this.peerConnection.addEventListener('track',event=>{
            remoteStream.addTrack(event.track,remoteStream);
            this.setState({stream:remoteStream})
        })
        this.peerConnection.addEventListener('datachannel',e=>{
            let conn = e.channel;
            conn.addEventListener('message',e=>console.log(e));
        })
        this.peerConnection.addEventListener('icecandidateerror',(err)=>{
            console.log("ice error ", err,"ice end")
        })
        this.peerConnection.addEventListener('icecandidate',e=>{
            console.log("icecandi ", e, "icecandi end")
            if(e.candidate){
                socket.emit('icecandidate',{receiver:data.sender,candidate:e.candidate});
            }
        })
        this.peerConnection.addEventListener('signalingstatechange',e=>console.log("signal change"))
        this.peerConnection.addEventListener('connectionstatechange',e=>{
            if(this.peerConnection.connectionState === 'connected'){
                console.log("peerConnection established");
            }
            else if(this.peerConnection.connectionState === 'closed'){
                console.log("closed connection");
            }
            
        })
        this.peerConnection.addEventListener('negotiationneeded',()=>{
            console.log("nwgoneede");
        })
        if(data.offer){
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            this.peerConnection.createAnswer().then(answer=>{
                this.peerConnection.setLocalDescription(answer).then(()=>{
                    socket.emit('answer',{receiver:data.sender,answer:answer});
                })
            })
        }
    }

    clearUp(){
        if(this.state.myStream){
            this.state.myStream.getTracks().forEach(track=>track.stop())
        }
        this.setState({isInCall:false,isCaller:false,isModalOpen:false,caller:{},receiver:{},stream:null,myStream:null})
    }

    

    updateActive(data){
        this.setState(old=>{
            return{
                groups:old.groups.map(group=>{
                    if(group.name_user_id === data.user_id){
                        return {...group,active:true}
                    }
                    return group;
                }),
                selectedContact : old.selectedContact === -1 ?
                    (-1) : (old.selectedContact.name_user_id === data.user_id ? 
                        ({...old.selectedContact,active : true}):(old.selectedContact)) 
            }
        })
    }
    updateInactive(data){
        this.setState(old=>{
            return{
                groups:old.groups.map(group=>{
                    if(group.name_user_id === data.user_id){
                        return {...group,active:false}
                    }
                    return group;
                }),
                selectedContact : old.selectedContact === -1 ?
                (-1) : (old.selectedContact.name_user_id === data.user_id ? 
                    ({...old.selectedContact,active : false}):(old.selectedContact)) 
            }
        })
    }

    updateSeen(data){
        this.setState(old=>({
            groups : old.groups.map(group=>{
                if(group.group_id !== data.group_id) return group;
                return{...group,lastseen:data.lastSeen}
            }),
            selectedContact : old.selectedContact.group_id === data.group_id ? {...old.selectedContact,lastseen:data.lastSeen}:old.selectedContact
        }))
    }

    changeSelected(selected){
        
        if(selected.group_id === this.state.selectedContact.group_id) return;
        this.setState(old =>({selectedContact : selected,searchUser:false,
            groups : old.groups.map(group =>{
                if(group.group_id === selected.group_id) return{...group,bold:false}
                return group;
            }),
            typing : false    
        }),()=>{
            socket.emit('message-seen',{group_id:selected.group_id});
            if(typeof(this.state.selectedContact.group_id) === 'string'){
                if(!this.state[this.state.selectedContact.group_id]) this.setState({[this.state.selectedContact.group_id] : []})
            }
            else if(this.state.selectedContact.group_id !== -1 && !this.state[this.state.selectedContact.group_id]){
                let url1 = constants.url + '/groups/'+this.state.selectedContact.group_id;
                let selected = this.state.selectedContact.group_id;
                if(this.state.showRequests) url1 = constants.url+'/requests/'+this.state.selectedContact.group_id;
                let notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : "Fetching Messages..."
                }
                this.addNotification(notification);
                fetch(url1,constants.getOptions)
                .then(resp => {
                    this.removeNotification(notification.notification_id);
                    if(resp.status === 200){
                        return resp.json();
                    }
                    throw new Error("Failed to fetch messages.Error code: " + resp.status);
                }).then(data=>{
                    this.setState({[selected]:data});
                })
                .catch(err=>{
                    notification = {
                        notification_id :  ++constants.notification_id['count'],
                        message : err.message
                    }
                    this.addNotification(notification);
                })
            }
            if(this.inputRef !== null && this.inputRef.current !== null){
                this.inputRef.current.focus();
            }
        });

    }

    changeSearchUser(search){
        this.setState(old=>({searchUser : search,selectedContact:search?{group_id:-1}:old.selectedContact}));
        
    }

    addRequestGroup(group){
        // if(this.state.groups.some(itm => itm.group_id === group.group_id)){
        //     this.changeSelected(group);
        //     return;
        // }
        for(let i = 0; i < this.state.groups.length;++i){
            if(this.state.groups[i].name_user_id === group.name_user_id){
                this.changeSelected(this.state.groups[i]);
                return;
            }
        }
        for(let i = 0; i < this.state.requests.length;++i){
            if(this.state.requests[i].name_user_id === group.name_user_id){
                this.setState({showRequests : true})
                this.changeSelected(this.state.requests[i]);
                return;
            }
        }
        this.setState(old=>{
            return({
                groups : [group,...old.groups]
            })
            
        },()=>this.changeSelected(group))
    }
    removeGroup(group_id){
        this.setState(old =>{
            let selected = old.selectedContact.group_id;
            if(selected === group_id) selected = -1;
            return({
                groups : old.groups.filter(group => group.group_id !== group_id),
                selectedContact : old.selectedContact.group_id === group_id ? {group_id:-1} : old.selectedContact,
                [group_id] : undefined
            }) 
        })
    }

    modifyRequestGroup(group_id,request_id){
        this.setState(old=>{
            let changedGroup = undefined;
            return({
                groups : old.groups.map(group =>{
                        if(group.group_id !== request_id) return group;
                        changedGroup = {...group,group_id : group_id};
                        this.updateMembers([changedGroup]);
                        return changedGroup;
                    }),
                [group_id] : old[group_id] ? old[group_id] : old[request_id],
                selectedContact : old.selectedContact.group_id === request_id ? changedGroup:old.selectedContact
            })
        })
    }

    modifyMessage(response){
        this.setState(old=>{
            return({
                [response.group_id] : old[response.group_id].map(message=>{
                    if(message.message_id === response.sendingId) return {...message,message_id:response.message_id}
                    return message;
                })
            })
        })
    }

    addMessage(data,received){
        let f = false;
        if(this.state[data.group_id]) this.setState(old =>({[data.group_id]:[...old[data.group_id],data]}));
        this.setState((old)=>{
            let group_index = -1;
            let groups = old.groups;
            for(let i = 0; i < groups.length;++i){
                if(groups[i].group_id === data.group_id){
                    let toGroup = groups[i];

                    if(received && old.selectedContact.group_id !== groups[i].group_id) 
                        toGroup = {
                            ...toGroup,message:data.message,bold:true,last_message_user_id : data.user_id,
                            last_time : Date.now()
                        }
                    else
                        toGroup = {
                            ...toGroup,message:data.message,bold:false,last_message_user_id : data.user_id,
                            last_time : Date.now()
                        }
                    group_index = i;
                    groups = [toGroup,...groups.slice(0,i),...groups.slice(i+1)]
                    break;
                }
            }

            let requests = old.requests;
            if(group_index === -1){
                for(let i = 0; i < requests.length;++i){
                    if(requests[i].group_id === data.group_id){
                        let toRequest = {
                            ...requests[i],message:data.message,last_message_user_id : data.user_id
                        }
                        requests = [toRequest,...requests.slice(0,i),...requests.slice(i+1)]
                    }
                }
            }
            return({
                groups : groups,
                requests : requests,
                selectedContact : old.selectedContact.group_id === data.group_id ? {
                    ...old.selectedContact,
                    message : data.message,last_message_user_id : data.user_id
                } : old.selectedContact
            })

            return{
                groups : old.groups.map(group=>{
                    if(group.group_id !== data.group_id) return group;
                    f = true;
                    if(received && old.selectedContact.group_id !== group.group_id) 
                        return({...group,message:data.message,bold:true,last_message_user_id : data.user_id})
                    return({...group,message:data.message,bold:false,last_message_user_id : data.user_id})
                }),
                requests:f?old.requests:old.requests.map(request=>{
                    if(request.group_id !== data.group_id) return request;
                    return({...request,message:data.message,last_message_user_id : data.user_id})
                }),
                selectedContact : old.selectedContact.group_id === data.group_id ? {
                    ...old.selectedContact,
                    message : data.message,last_message_user_id : data.user_id
                } : old.selectedContact
            }})
    }

    addGroup(group){
        this.setState(old=>({groups : [...old.groups, group]}))
    }
    updateGroupMembers(members,group_id){
        this.setState(old=>({
            groups : old.groups.map(group =>{
                if(group.group_id === group_id){
                    this.updateMembers([group]);
                    return{
                        ...group,
                        group_members : members
                    }
                }
                return group;
            }),
            selectedContact : old.selectedContact === -1 ?
            (-1) : (old.selectedContact.group_id === group_id ? 
                ({...old.selectedContact,group_members : members}):(old.selectedContact)) 
        }))
    }

    render(){
        
        
        let right = this.state[this.state.selectedContact.group_id] ?
         <Message 
            selected = {this.state.selectedContact} 
            user={this.state.user} 
            searchUser={this.state.searchUser} 
            messages={this.state[this.state.selectedContact.group_id]}
            typing = {this.state.typing}
            members = {this.state.members}
            />
             : null;
        if(this.state.searchUser) 
            right = <SearchUsers addRequestGroup={this.addRequestGroup}
                    addNotification={this.addNotification} 
                    removeNotification = {this.removeNotification} 
                    clearNotificationType = {this.clearNotificationType}
                     />
        let groups ;
        if(this.state.showRequests) groups = this.state.requests;
        else if(this.state.isShowActive){
            groups = this.state.activeUsers;
        }
        else groups = this.state.groups;
        return(
            <div>
            <SplitPane
                stream={this.state.stream}
                mediaStream = {this.state.mediaStream}
                isModalOpen = {this.state.isModalOpen}
                isInCall = {this.state.isInCall} openModal={this.openModal} 
                addNotification = {this.addNotification}
                removeNotification = {this.removeNotification}
                notifications = {this.state.notifications}
                searchUser = {this.state.searchUser}
                modal={<ModalComp 
                    caller={this.state.caller} receiver={this.state.receiver} isModalOpen={this.state.isModalOpen}
                    isCaller={this.state.isCaller} acceptCall={this.acceptCall} closeModal={this.closeModal}
                    stream = {this.state.stream} closeCall={this.closeCall}
                    callType = {this.state.callType}
                     />}
                selected = {this.state.selectedContact}
                left={<Contact removeGroup={this.removeGroup}
                    groups={groups}
                    onSelect={this.changeSelected} selected={this.state.selectedContact}
                    user={this.state.user} members = {this.state.members}
                    searchUser = {this.state.searchUser}
                />}
                iconbar={<IconBar changeSearchUser={this.changeSearchUser} searchUser={this.state.searchUser}
                    showRequests={this.state.showRequests} changeshowRequests={this.changeshowRequests}
                    selected = {this.state.selectedContact}
                    addGroup = {this.addGroup} 
                    addNotification = {this.addNotification}
                    removeNotification = {this.removeNotification}
                    activeUsersFilter = {this.activeUsersFilter}
                    isShowActive = {this.state.isShowActive}
                    setIsShowActive = {this.setIsShowActive}
                    requestCount = {this.state.requests.length}
                    />}
                rightup = {<MessageIconBar 
                selected={this.state.selectedContact} emitVideoCallRequest={this.emitVideoCallRequest}
                groups = {this.state.groups} updateGroupMembers={this.updateGroupMembers}
                addNotification = {this.addNotification}
                removeNotification = {this.removeNotification}
                addRequestGroup = {this.addRequestGroup}
                user = {this.state.user}
                changeSelected = {this.changeSelected}
                 />}
                right={right} 
                rightBottom={this.state.selectedContact.group_id === -1 || this.state.searchUser?
                null:<Textarea modifyRequestGroup={this.modifyRequestGroup} 
                        selected={this.state.selectedContact.group_id}
                        user={this.state.user} addMessage={this.addMessage} 
                        modifyMessage={this.modifyMessage} 
                        inputRef={this.inputRef}
                        sendTypingEvent = {this.sendTypingEvent}
                        addNotification = {this.addNotification}
                        removeNotification = {this.removeNotification}
                        />}
                responseToRequest={this.state.showRequests && this.state.selectedContact.group_id !==-1?
                    <ResponseToRequest addRequestInProcess={this.addRequestInProcess} 
                        requestsInProcess={this.state.requestsInProcess.some(id=> id===this.state.selectedContact.group_id)} />:null}
            />
            </div>
        )
    }

    
}

export default Chat;