let users = [];

const addUser = async (userId, socketId) => {
  //is user already there?
  const user = users.find((user) => user.id === userId);
  console.log(userId);
  // console.log(user.id);
  if (user && user.socketId === socketId) {
    // console.log('user already there');
    return users;
  } else {
    console.log('user not already there');
    
    if (user && user.socketId !== socketId) {
      console.log('user not already there but socketId is different');
      await removeUser(user.socketId);
    }
    const newUser = { userId, socketId };
    // console.log(newUser);
    users.push(newUser);
    return users;
  }
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  console.log("disconnected");
  // console.log(users);
  console.log(socketId);
};

const findConnectedUser = (userId) => {
  console.log("connected");
  return users.find((user) => user.userId === userId);
};

const socketHandlers = (io) => {
  return io.on('connection', (socket) => {
    socket.on('join', async ({ userId }) => {
      const users = await addUser(userId, socket.id);

      setInterval(() => {
        //sending back users other than logged in users
        socket.emit('connectedUsers', {
          users: users.filter((user) => user.id !== userId),
        });
      }, 10000);
    });

    socket.on('like', async ({ postId, sender, receiver, like }) => {
      if (sender && receiver.id !== sender.userId) {
        const receiverSocket = findConnectedUser(receiver.id);
        if (receiverSocket && like) {
          io.to(receiverSocket.socketId).emit('notificationReceived', {
            postId,
            senderName: sender.name,
            receiverName: receiver.name,
            senderImage: sender.avatar,
          });
        }
      }
    });

    socket.on('comment', async ({ postId, sender, receiver }) => {
      if (sender && receiver.id !== sender.userId) {
        const receiverSocket = findConnectedUser(receiver.id);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('notificationReceived', {
            postId,
            senderName: sender.name,
            receiverName: receiver.name,
            receiverId: receiver.id,
            senderImage: sender.avatar,
            date: new Date().toISOString(),
          });
        }
      }
    });

    socket.on('follow', async ({ sender, receiver }) => {
      if (sender && receiver.id !== sender.userId) {
        const receiverSocket = findConnectedUser(receiver.id);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('notificationReceived', {
            senderName: sender.name,
            receiverName: receiver.name,
            receiverId: receiver.id,
            senderImage: sender.avatar,
            date: new Date().toISOString(),
          });
        }
      }
    });
    socket.on('disconnect', () => {
      removeUser(socket.id);
    });
  });
};

exports.socketHandlers = socketHandlers;
