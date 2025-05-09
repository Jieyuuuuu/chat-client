import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// 连接Socket.IO服务器
const socket = io('https://chat-server-lacd.onrender.com');

// 主题配置
const themes = {
  light: {
    background: '#ffffff',
    text: '#333333',
    primary: '#4CAF50',
    secondary: '#f1f1f1',
    border: '#cccccc'
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    primary: '#66bb6a',
    secondary: '#2d2d2d',
    border: '#404040'
  }
};

// 字体大小配置
const fontSizes = {
  small: {
    message: '0.9rem',
    input: '0.9rem',
    heading: '1.4rem'
  },
  medium: {
    message: '1rem',
    input: '1rem',
    heading: '1.6rem'
  },
  large: {
    message: '1.2rem',
    input: '1.2rem',
    heading: '1.8rem'
  }
};

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
  
  // 添加连接状态
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  // 设置状态
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [chatBackground, setChatBackground] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 引用
  const messagesEndRef = useRef(null);
  const messageSound = useRef(new Audio('/message.mp3'));

  // 加载保存的设置
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
    if (savedSettings.isDarkMode !== undefined) setIsDarkMode(savedSettings.isDarkMode);
    if (savedSettings.fontSize) setFontSize(savedSettings.fontSize);
    if (savedSettings.chatBackground) setChatBackground(savedSettings.chatBackground);
    if (savedSettings.soundEnabled !== undefined) setSoundEnabled(savedSettings.soundEnabled);
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify({
      isDarkMode,
      fontSize,
      chatBackground,
      soundEnabled
    }));
  }, [isDarkMode, fontSize, chatBackground, soundEnabled]);

  // 监听接收消息事件
  useEffect(() => {
    socket.on('receiveMessage', (newMessage) => {
      if (soundEnabled) {
        messageSound.current.play().catch(() => {});
      }
      setMessages((prevMessages) => [...prevMessages, {
        ...newMessage,
        timestamp: new Date().toLocaleTimeString(),
        type: 'user'
      }]);
    });

    socket.on('userJoined', (data) => {
      setOnlineCount(data.onlineCount);
      setMessages(prev => [...prev, {
        user: '系統',
        text: `${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已加入聊天室`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    });

    socket.on('userLeft', (data) => {
      setOnlineCount(data.onlineCount);
      setMessages(prev => [...prev, {
        user: '系統',
        text: `${data.user.nickname} (${data.user.age}, ${data.user.gender}) 已離開聊天室`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    });

    socket.on('online count', (count) => {
      setOnlineCount(count);
    });
    
    return () => {
      socket.off('receiveMessage');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('online count');
    };
  }, [soundEnabled]);

  // 监听Socket连接状态
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsConnecting(true);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsConnecting(true);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 聊天消息更新时，滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  // 设置面板组件
  const SettingsPanel = () => (
    <div className={`settings-panel ${isDarkMode ? 'dark-mode' : ''}`}
         style={{
           position: 'absolute',
           right: isSettingsOpen ? '0' : '-300px',
           top: '0',
           width: '300px',
           height: '100%',
           backgroundColor: isDarkMode ? themes.dark.background : themes.light.background,
           borderLeft: `1px solid ${isDarkMode ? themes.dark.border : themes.light.border}`,
           padding: '20px',
           transition: 'right 0.3s ease',
           zIndex: 1000,
           boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
         }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: isDarkMode ? themes.dark.text : themes.light.text }}>設置</h3>
        <button
          onClick={() => setIsSettingsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: isDarkMode ? themes.dark.text : themes.light.text,
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px',
          color: isDarkMode ? themes.dark.text : themes.light.text 
        }}>
          深色模式
        </label>
        <input
          type="checkbox"
          checked={isDarkMode}
          onChange={(e) => setIsDarkMode(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px',
          color: isDarkMode ? themes.dark.text : themes.light.text 
        }}>
          字體大小
        </label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          style={{
            ...inputStyle,
            width: '100%',
            cursor: 'pointer'
          }}
        >
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
          <option value="xlarge">超大</option>
          <option value="xxlarge">巨大</option>
        </select>
      </div>

      <div className="setting-item">
        <label>背景樣式</label>
        <select
          value={chatBackground}
          onChange={(e) => setChatBackground(e.target.value)}
        >
          <option value="default">預設</option>
          <option value="gradient1">薄暮漸層</option>
          <option value="gradient2">春意漸層</option>
          <option value="gradient3">海洋漸層</option>
          <option value="gradient4">紫霞漸層</option>
          <option value="gradient5">金秋漸層</option>
        </select>
      </div>

      <div className="setting-item">
        <label>消息提示音</label>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
      </div>
    </div>
  );

  // 修改字體大小邏輯
  const getFontSize = () => {
    switch (fontSize) {
      case 'small':
        return '14px';
      case 'medium':
        return '16px';
      case 'large':
        return '18px';
      case 'xlarge':
        return '20px';
      case 'xxlarge':
        return '24px';
      default:
        return '16px';
    }
  };

  // 修改消息樣式
  const messageStyle = {
    padding: '10px 15px',
    marginBottom: '10px',
    borderRadius: '10px',
    backgroundColor: isDarkMode ? themes.dark.messageBg : themes.light.messageBg,
    color: isDarkMode ? themes.dark.text : themes.light.text,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    fontSize: getFontSize(),  // 使用字體大小函數
    transition: 'all 0.3s ease'
  };

  const systemMessageStyle = {
    ...messageStyle,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    color: isDarkMode ? themes.dark.text : themes.light.text,
    textAlign: 'center',
    maxWidth: '100%',
    margin: '10px 0',
    fontSize: getFontSize(),  // 使用字體大小函數
    fontStyle: 'italic'
  };

  // 样式配置
  const currentTheme = isDarkMode ? themes.dark : themes.light;
  
  const loginStyle = {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '300px',
    margin: '100px auto',
    padding: '20px',
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: currentTheme.background,
    color: currentTheme.text,
    transition: 'all 0.3s ease'
  };

  const chatRoomStyle = {
    maxWidth: '800px',
    height: '100vh',
    margin: '0 auto',
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: currentTheme.background,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: currentTheme.secondary,
    backgroundImage: chatBackground === 'gradient1' 
      ? 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)'
      : chatBackground === 'gradient2'
      ? 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)'
      : chatBackground === 'gradient3'
      ? 'linear-gradient(120deg, #0093E9 0%, #80D0C7 100%)'
      : chatBackground === 'gradient4'
      ? 'linear-gradient(120deg, #8EC5FC 0%, #E0C3FC 100%)'
      : chatBackground === 'gradient5'
      ? 'linear-gradient(120deg, #F4D03F 0%, #16A085 100%)'
      : 'none',
    color: chatBackground === 'default' ? currentTheme.text : '#333333',
    fontSize: fontSizes[fontSize].message,
    transition: 'all 0.3s ease'
  };

  const formStyle = {
    display: 'flex',
    padding: '15px',
    backgroundColor: currentTheme.background,
    borderTop: `1px solid ${currentTheme.border}`,
    transition: 'all 0.3s ease',
    height: '70px'
  };

  const inputStyle = {
    flex: '1',
    padding: '12px',
    marginRight: '10px',
    borderRadius: '5px',
    border: `1px solid ${currentTheme.border}`,
    backgroundColor: currentTheme.background,
    color: currentTheme.text,
    fontSize: fontSizes[fontSize].input,
    transition: 'all 0.3s ease'
  };

  const buttonStyle = {
    padding: '12px 24px',
    backgroundColor: currentTheme.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: fontSizes[fontSize].input,
    transition: 'all 0.3s ease',
    ':hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)'
    }
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: currentTheme.background,
    borderBottom: `1px solid ${currentTheme.border}`,
    transition: 'all 0.3s ease',
    height: '60px'
  };

  const timestampStyle = {
    fontSize: '0.8em',
    color: isDarkMode ? '#666666' : '#999999',
    marginTop: '4px'
  };

  // 登录页面
  if (!isJoined) {
    return (
      <div style={loginStyle}>
        {isConnecting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            zIndex: 1000,
            animation: 'pulse 2s infinite'
          }}>
            正在連線到伺服器...
          </div>
        )}
        <h2 style={{ 
          textAlign: 'center',
          fontSize: fontSizes[fontSize].heading,
          color: currentTheme.text 
        }}>匿名聊天室</h2>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '15px',
          color: currentTheme.text
        }}>
          目前線上：{onlineCount} 人
        </div>
        <label style={{ marginBottom: '5px', color: currentTheme.text }}>暱稱:</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        
        <label style={{ marginBottom: '5px', color: currentTheme.text }}>年齡:</label>
        <input
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        
        <label style={{ marginBottom: '5px', color: currentTheme.text }}>性別:</label>
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
    <>
      {isConnecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          zIndex: 1000,
          animation: 'pulse 2s infinite'
        }}>
          正在連線到伺服器...
        </div>
      )}
      <div style={chatRoomStyle} className="chat-container">
        <div style={headerStyle}>
          <h2 style={{ 
            margin: '0',
            fontSize: fontSizes[fontSize].heading,
            color: currentTheme.text 
          }}>匿名聊天室</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: currentTheme.text }}>目前線上：{onlineCount} 人</div>
            <button 
              className="settings-button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: currentTheme.text,
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ⚙️
            </button>
          </div>
        </div>
        
        <SettingsPanel />
        
        <div style={messagesContainerStyle}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className="message message-bubble"
              style={msg.type === 'system' ? systemMessageStyle : messageStyle}
            >
              {msg.type !== 'system' && (
                <div style={{ 
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  color: isDarkMode ? '#e2e8f0' : '#2d3748'
                }}>{msg.user}</div>
              )}
              <div style={{
                wordBreak: 'break-word',
                lineHeight: '1.5'
              }}>{msg.text}</div>
              <div style={{
                ...timestampStyle,
                textAlign: msg.type === 'system' ? 'center' : 'right'
              }}>{msg.timestamp}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} style={formStyle}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="輸入訊息..."
            style={{
              ...inputStyle,
              height: '40px'
            }}
          />
          <button type="submit" style={{
            ...buttonStyle,
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            發送
          </button>
        </form>
      </div>

      <a 
        href="https://github.com/Jieyuuuuu"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          color: '#000000',
          textDecoration: 'none',
          fontSize: '0.9em',
          opacity: 0.7,
          transition: 'opacity 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        作者: Jieyu
      </a>
    </>
  );
}

export default App; 