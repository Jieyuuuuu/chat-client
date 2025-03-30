import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// 连接Socket.IO服务器
const socket = io('https://chat-server-lacd.onrender.com');

function App() {
  // 用户信息状态
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('男');
  const [isJoined, setIsJoined] = useState(false);
  
  // 聊天室状态
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  // 聊天窗口引用，用于滚动到底部
  const messagesEndRef = useRef(null);
  const notificationsEndRef = useRef(null);

  // 监听接收消息事件
  useEffect(() => {
    socket.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, {
        ...newMessage,
        timestamp: new Date().toLocaleTimeString(),
        type: 'user'
      }]);
    });

    // 监听用户加入事件
    socket.on('userJoined', (data) => {
      setOnlineCount(data.onlineCount);
      addNotification(`${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已加入聊天室`);
      setMessages(prev => [...prev, {
        user: '系統',
        text: `${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已加入聊天室`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    });

    // 监听用户离开事件
    socket.on('userLeft', (data) => {
      setOnlineCount(data.onlineCount);
      addNotification(`${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已離開聊天室`);
      setMessages(prev => [...prev, {
        user: '系統',
        text: `${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已離開聊天室`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    });
    
    // 组件卸载时断开连接
    return () => {
      socket.off('receiveMessage');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, []);

  // 聊天消息更新时，滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 通知更新时，滚动到底部
  useEffect(() => {
    if (notificationsEndRef.current) {
      notificationsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notifications]);

  // 添加通知
  const addNotification = (text) => {
    setNotifications(prev => [...prev, { id: Date.now(), text }]);
    // 5秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== Date.now()));
    }, 5000);
  };

  // 处理进入聊天室
  const handleJoin = () => {
    if (nickname.trim() === '') {
      alert('請輸入暱稱');
      return;
    }
    if (age.trim() === '') {
      alert('請輸入年齡');
      return;
    }
    
    const userInfo = {
      nickname,
      age,
      gender
    };
    
    socket.emit('userJoin', userInfo);
    setIsJoined(true);
  };

  // 处理发送消息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    const userMessage = {
      user: `${nickname} (${age}, ${gender})`,
      text: message,
      timestamp: new Date().toLocaleTimeString(),
      type: 'user'
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

  const systemMessageStyle = {
    ...messageStyle,
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    textAlign: 'center'
  };

  const notificationStyle = {
    margin: '5px 0',
    padding: '5px',
    backgroundColor: '#e3f2fd',
    borderRadius: '3px',
    fontSize: '0.9em',
    color: '#1976d2'
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

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee'
  };

  const timestampStyle = {
    fontSize: '0.8em',
    color: '#666',
    marginTop: '4px'
  };

  // 登录页面
  if (!isJoined) {
    return (
      <div style={loginStyle}>
        <h2 style={{ textAlign: 'center' }}>匿名聊天室</h2>
        <label style={{ marginBottom: '5px' }}>暱稱:</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        
        <label style={{ marginBottom: '5px' }}>年齡:</label>
        <input
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        
        <label style={{ marginBottom: '5px' }}>性別:</label>
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
          進入聊天室
        </button>
      </div>
    );
  }

  // 聊天室页面
  return (
    <div style={chatRoomStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: '0' }}>匿名聊天室</h2>
        <div>目前線上：{onlineCount} 人</div>
      </div>
      
      <div style={messagesContainerStyle}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.type === 'system' ? systemMessageStyle : messageStyle}>
            <div style={{ fontWeight: 'bold' }}>{msg.user}</div>
            <div>{msg.text}</div>
            <div style={timestampStyle}>{msg.timestamp}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        {notifications.map(notification => (
          <div key={notification.id} style={notificationStyle}>
            {notification.text}
          </div>
        ))}
        <div ref={notificationsEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} style={formStyle}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="輸入訊息..."
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          發送
        </button>
      </form>
    </div>
  );
}

export default App; 