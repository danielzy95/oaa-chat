import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { Message } from '..'
import ContentEditable from 'react-contenteditable'
import Mood from 'material-ui/svg-icons/social/mood'
import Send from 'material-ui/svg-icons/content/send'
import IconButton from 'material-ui/IconButton'
import chatPattern from '../../res/chat-pattern.png'
import styles from './Chat.css'

const CMDC = '~', ADD = 'add', KICK = 'kick', CLEAR = 'clear'

const messagesStyles = {
	backgroundImage: `url(${chatPattern})`
}

const emojiBtnStyles = {
	marginRight: 20
}

const sendBtnStyles = {
	marginLeft: 20
}

@observer class Chat extends Component {
	constructor (props) {
		super(props)
		props.connection.onmessage = this.onMessage.bind(this)
		this.scrollBottom = false
		this.state = {
			message: ''
		}
	}
	componentDidUpdate() {
		if (this.scrollBottom) {
			const { msgs } = this.refs
			msgs.scrollTop = msgs.scrollHeight
			this.scrollBottom = false
		}
	}
	updateMessage (e) {
		this.setState({ 
			...this.state, 
			message: e.target.value
		})
	}
	executeCommand (message) {
		if (message[0] !== CMDC)
			return false

		const tokens = message.slice(1, message.length).split(" ")
		const cmd = tokens[0]
		const { sender, room } = this.props

		if (cmd === ADD) {
			const user = tokens[1]
			if (sender === room.admin && sender !== user)
				this.props.onAdd(room, [user])
		} else if (cmd === KICK) {
			const user = tokens[1]
			if (sender === room.admin && sender !== user)
				this.props.onKick(room, [user])
		} else if (cmd === CLEAR)
			room.messages = [] // Tengo que esperar al PUT rooms
		else
			return false

		return true
	}
	onMessage (evt) {
		const { room } = this.props
		const data = JSON.parse(evt.data)

		if (data.room !== room.title)
			return

		this.scrollBottom = true
		room.messages.push(data.message)
	}
	sendMessage () {
		const { message } = this.state

		if (!message.length)
			return

		if (!this.executeCommand(message)) {
			const { connection, room, sender } = this.props
			connection.send(JSON.stringify({	
				room: room.title,
				message: { sender, body: message, attachment: null }
			}))
		}

		this.setState({ 
			...this.state,
			message: '' 
		})
	}
	onKeyPress (e) {
		if (!e.shiftKey && e.which === 13) {
			e.preventDefault()
			this.sendMessage()
		}
	}
	render () {
		const { className, sender, room: { messages } } = this.props
		const { message } = this.state
		return (
			<div class={`${styles.root} ${className}`}>
				<div ref="msgs" class={styles.messages} style={messagesStyles}>
					{
						messages.map((msg, i) => (
							<Message key={i} {...msg} sent={ msg.sender === sender } />
						))
					}
				</div>
				<div class={styles.footer}>
					<div class={styles.blockCompose}>
						<IconButton class={styles.emojiBtn} style={emojiBtnStyles} 
						            href='http://emoji.codes/' target='_blank'>
								<Mood color='#999694' />
							</IconButton>
						<div class={styles.inputContainer}>
							<div style={{ position: 'relative' }}>
								<div class={styles.inputPlaceholder} 
								     style={{ visibility: message.length ? 'hidden' : 'visible' }}>
								     Type a message
								</div>
								<ContentEditable 
									class={styles.input}
									html={message} 
									disabled={false}
									onChange={this.updateMessage.bind(this)}
									onKeyPress={this.onKeyPress.bind(this)} />
							</div>
						</div>
						<IconButton class={styles.sendBtn} style={sendBtnStyles} 
						            onClick={this.sendMessage.bind(this)}>
							<Send color='#999694' />
						</IconButton>
					</div>
				</div>
			</div>
		)
	}
}

export default Chat