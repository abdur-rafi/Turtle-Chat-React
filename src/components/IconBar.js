import React from 'react';
import {FaSearch,FaUserPlus} from 'react-icons/fa'
import {AiOutlineUsergroupAdd,AiOutlineUserAdd,AiOutlineSearch,AiOutlineUser} from 'react-icons/ai';
import {FiLogOut} from 'react-icons/fi'
import '../stylesheets/iconbar.css'
import MediaQuery,{useMediaQuery} from 'react-responsive'
import Modal from 'react-modal';
import Draggable from 'react-draggable';
var constants = require('../constants');

class IconBar extends React.Component{
    constructor(props){
        super(props);
        this.switchSearchUser = this.switchSearchUser.bind(this);
        this.switchShowRequests = this.switchShowRequests.bind(this);
        this.state = {
            addGroup : false,
            selectedFile : undefined,
            imageModal: false,
            boundChosen:false,
            group_name: "",
            create_group_pressed : false,
            notification_id : undefined,
            is500px : window.matchMedia("(max-width:500px)").matches,
            is775px : window.matchMedia("(max-width:775px)").matches
        }
        this.imgRef = React.createRef();
        this.rectRef = React.createRef();
        this.CreateGroupModal = this.CreateGroupModal.bind(this);
        this.ImageModal = this.ImageModal.bind(this);
        // this.group_name_field = React.createRef();
    }

    componentDidMount(){
        let handler775px =  (e) => this.setState({is775px : e.matches});
        window.matchMedia("(max-width:775px)").addEventListener("change",handler775px);
        let handler500px = e => this.setState({is500px : e.matches})
        window.matchMedia("(max-width : 500px)").addEventListener("change",handler500px);
    }

    switchSearchUser(){
        this.props.changeSearchUser(!this.props.searchUser);
    }

    switchShowRequests(){
        this.props.changeshowRequests(!this.props.showRequests);
    }

    CreateGroupModal(){

        let textFieldOnChange = (e)=> {
            this.setState({group_name : e.target.value});
            if(this.state.notification_id)
                this.props.removeNotification(this.state.notification_id);
            this.setState({notification_id : undefined})
        }

        let fileFieldOnChange = (e)=>{
            if(e.target.files[0]){
                if(this.state.notification_id){
                    this.props.removeNotification(this.state.notification_id);
                    this.setState({notification_id : undefined})
                }
                this.setState({boundChosen:false,selectedFile:URL.createObjectURL(e.target.files[0])});
            }
        }

        let chooseBoundingBoxOnClick = () => {
            this.setState(old=>({imageModal : true,addGroup:false}))
        }

        let imgStyleOnBoundChosen = {
            width : "120px",
            height:"120px"
        }

        let createGroupButtonOnClick = ()=>{
            if(this.state.group_name.trim().length === 0){
                if(this.state.notification_id)
                    this.props.removeNotification(this.state.notification_id);
                let notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : "Please Enter A Name"
                }
                this.setState({notification_id : notification.notification_id})
                this.props.addNotification(notification);
                return;
            }
            if(this.state.selectedFile === undefined){
                if(this.state.notification_id)
                    this.props.removeNotification(this.state.notification_id);
                let notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : "Select an image for the group"
                }
                this.setState({notification_id : notification.notification_id})
                this.props.addNotification(notification);
                return;
            }
            if(!this.state.boundChosen){
                this.setState({imageModal : true});
                return;
            }
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : "Processing Create Group Request..."
            }
            this.props.addNotification(notification);
            
            this.setState({create_group_pressed : true})
            let postOption = {
                ...constants.postOption,
                body:JSON.stringify({
                    group_name : this.state.group_name,
                    group_image : this.state.selectedFile.substring(22,this.state.selectedFile.length)
                })
            }
            fetch(constants.url + '/groups/newgroup',postOption)
            .then(resp =>{
                this.setState({
                    addGroup : false,
                    selectedFile : undefined,
                    imageModal: false,
                    boundChosen:false,
                    group_name: "",
                    create_group_pressed : false,
                    notification_id : undefined

                })
                this.props.removeNotification(notification.notification_id);
                if(resp.status !== 200){
                    throw new Error("Group creation failed. Error code " + resp.status);
                }
                return resp.json()
            }).then(data =>{
                this.props.addGroup(data.group);
            })
            .catch(err=>{
                let notification = {
                    notification_id : constants.notification_id['count'],
                    message : err.message
                }
                this.props.addNotification(notification);
            })
            
        }

        let modalStyle = {
            top:"20vh",
            left:"25vw",
            right:"25vw",
            bottom:"20vh",
            backgroundColor:"transparent",
            padding : "0px"
        };
        if(this.state.is775px){
            modalStyle = {
                top:"15vh",
                left:"15vw",
                right:"15vw",
                bottom:"10vh",
                backgroundColor:"transparent",
                padding : "0px"
            }
        }
        if(this.state.is500px){
            modalStyle = {
                top:"15vh",
                left:"10vw",
                right:"10vw",
                bottom:"10vh",
                backgroundColor:"transparent",
                padding : "0px"
            }
        }

        return(
            <Modal isOpen={this.state.addGroup} style={{overlay:{
                    zIndex:"4"
                },content:modalStyle
            }}  onRequestClose={()=>this.setState({addGroup : false})}>
                <div className="modal-container-group" id="modal-container-group-id">
                    <div className="modal-title">
                        Create New Group
                    </div>
                    <div className="give-name-label">
                        Give the group a name
                    </div>
                    <input type="text" value={this.state.group_name} onChange={textFieldOnChange}/>
                    <div className="give-name-label" >
                        Choose an image
                    </div>
                    <input type="file" accept="image/*" onChange={fileFieldOnChange}/>
                    { this.state.selectedFile &&
                    <div className="modal-image-container">
                        {!this.state.boundChosen && 
                        <div>
                            <button onClick={chooseBoundingBoxOnClick}>
                                Choose bounding box
                            </button>
                        </div>}
                        <img style={this.state.boundChosen ? imgStyleOnBoundChosen : {}} src={this.state.selectedFile}/>
                    </div>}
                    <button disabled={this.state.create_group_pressed} onClick={createGroupButtonOnClick}>
                        Looks All right? Then create the group
                    </button>
                </div>
            </Modal>
        );
    }
    
    ImageModal(){
        let onRequestClose = ()=>{
            this.setState(old=>({
                imageModal : false,
                addGroup:true
            }))
        }
        let confirmButtonOnClick = ()=>{
            let box = this.rectRef.current.getBoundingClientRect();
            let imgBox = this.imgRef.current.getBoundingClientRect();
            let x = box.left;
            let y = box.top ;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var img = this.imgRef.current;
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;
            context.drawImage(img, 0, 0,canvas.width,canvas.height);
            var myData = context.getImageData(x-imgBox.left, y-imgBox.y, 120, 120);
            context.clearRect(0,0,canvas.width,canvas.height);
            canvas.height = 120;
            canvas.width = 120;
            context.putImageData(myData,0,0);
            this.setState({
                selectedFile:canvas.toDataURL(),
                imageModal:false,
                addGroup:true,
                boundChosen:true
            });
        }
        let cancelButtonOnClick = ()=>{
            this.setState({
                imageModal:false,
                addGroup:true
            })
        }
        return(
        <Modal className="image-modal" overlayClassName="image-modal-overlay" style={{
            content : {
                padding : "0px"
        }}}
            isOpen={this.state.imageModal} onRequestClose={onRequestClose}>
            <div className="crop-image-container">
                <div className="crop-image">
                    <Draggable bounds="parent" >
                        <div ref={this.rectRef} className="rect" >
                        </div>
                    </Draggable>
                    <img ref={this.imgRef} src={this.state.selectedFile} ></img>
                </div>
                <div>
                    <button onClick={confirmButtonOnClick}>Confirm</button>
                    <button onClick={cancelButtonOnClick}>Cancel</button>
                </div>
            </div>
            
        </Modal>
        )
    }

    render(){
        const is800px = window.matchMedia('(max-width:650px)').matches;
        let activeIconOnClick = () =>{
            this.props.activeUsersFilter();
            this.props.setIsShowActive(!this.props.isShowActive);
        }
        let logOut = ()=>{
            let notification = {
                notification_id : constants.notification_id['count']++,
                message : "Logging out..."
            }
            this.props.addNotification(notification);
            fetch(constants.url + '/users/log/logout',constants.postOption)
            .then(resp=>{
                if(resp.status === 200){
                    window.location.reload();
                    return;
                }
                this.props.removeNotification(notification.notification_id);
                throw new Error("Failed to log out. Error code: " + resp.status)
            })
            .catch(err=>{
                notification = {
                    notification_id : ++constants.notification_id['count'],
                    message : err.message
                }
                this.props.addNotification(notification);
            })
        }

        let split = !is800px || (this.props.selected.group_id === -1 && this.props.searchUser === false)

        return(
            <div>
                <div className={ split ? "iconBar" : "iconBar iconBar-split"}>
                    <div onClick={this.switchSearchUser} className={this.props.searchUser?'back-blue':null} title="Search Users">
                        <AiOutlineSearch className={ (!is800px || this.props.selected.group_id === -1)? "searchIcon" : "searchIcon"} />
                    </div>
                    <div onClick={this.switchShowRequests} 
                        className={ "user-request-count-icon-container " + (this.props.showRequests?'back-blue':"")} title="Message Requests">
                        <AiOutlineUserAdd className={(!is800px || this.props.selected.group_id === -1)? "addIcon" : "addIcon"} />
                        <div className="user-request-count">
                            {this.props.requestCount}
                        </div>
                    </div>
                    <div className={ (this.state.addGroup?'back-blue':"")} onClick={()=>this.setState(old=>({addGroup:!old.addGroup}))} title="Create New Group">
                        <AiOutlineUsergroupAdd className={(!is800px || this.props.selected.group_id === -1)? "new-group-icons" : "new-group-icons"} />
                        
                    </div>
                    <div className={"active-users-icon-container " + (this.props.isShowActive ? "back-blue " : "") + (is800px ? "active-users-icon-container-split" : "") }
                    onClick={activeIconOnClick} >
                        <div title="active users">
                            <div></div>
                            <AiOutlineUser className="active-users-icon"/>
                        </div>
                    </div>
                    <div onClick={logOut}>
                        <FiLogOut className="logout-icon" />
                    </div>
                    <this.CreateGroupModal/>
                    <this.ImageModal/>
                </div>
            </div>
        )
        
    }
}
export default IconBar;