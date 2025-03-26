import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// 连接Socket.IO服务器
const socket = io('https://chat-server-lacd.onrender.com');

function App() {
  // 用户信息状态
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('男');
  const [isJoined, setIsJoined] = useState(false);
  
  // 聊天室状态
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  // 聊天窗口引用，用于滚动到底部
  const messagesEndRef = useRef(null);

  // 监听接收消息事件
  useEffect(() => {
    socket.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    
    // 组件卸载时断开连接
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  // 聊天消息更新时，滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 处理进入聊天室
  const handleJoin = () => {
    if (age.trim() === '') {
      alert('请输入年龄');
      return;
    }
    setIsJoined(true);
  };

  // 处理发送消息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    const userMessage = {
      user: `匿名 (${age}, ${gender})`,
      text: message
    };
    
    socket.emit('sendMessage', userMessage);
    setMessage('');
  };

  // 登录页面样式
  const loginStyle = {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '300px',
    margin: '100px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };

  // 聊天室样式
  const chatRoomStyle = {
    maxWidth: '600px',
    margin: '20px auto',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };

  const messagesContainerStyle = {
    height: '400px',
    overflowY: 'auto',
    padding: '10px',
    borderBottom: '1px solid #eee'
  };

  const messageStyle = {
    margin: '10px 0',
    padding: '8px',
    backgroundColor: '#f1f1f1',
    borderRadius: '5px'
  };

  const formStyle = {
    display: 'flex',
    padding: '10px'
  };

  const inputStyle = {
    flex: '1',
    padding: '8px',
    marginRight: '10px',
    borderRadius: '3px',
    border: '1px solid #ddd'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  };

  // 登录页面
  if (!isJoined) {
    return (
      <div style={loginStyle}>
        <h2 style={{ textAlign: 'center' }}>匿名聊天室</h2>
        <label style={{ marginBottom: '5px' }}>年龄:</label>
        <input
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        
        <label style={{ marginBottom: '5px' }}>性别:</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={{ ...inputStyle, marginBottom: '15px' }}
        >
          <option value="男">男</option>
          <option value="女">女</option>
          <option value="其他">其他</option>
        </select>
        
        <button onClick={handleJoin} style={buttonStyle}>
          进入聊天室
        </button>
      </div>
    );
  }

  // 聊天室页面
  return (
    <div style={chatRoomStyle}>
      <h2 style={{ textAlign: 'center', padding: '10px', margin: '0', borderBottom: '1px solid #eee' }}>
        匿名聊天室
      </h2>
      
      <div style={messagesContainerStyle}>
        {messages.map((msg, index) => (
          <div key={index} style={messageStyle}>
            <div style={{ fontWeight: 'bold' }}>{msg.user}</div>
            <div>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} style={formStyle}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          发送
        </button>
      </form>
    </div>
  );
}

export default App; 