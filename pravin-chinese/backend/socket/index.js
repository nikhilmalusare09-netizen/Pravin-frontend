let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join customer order tracking room
    socket.on('join:order', (orderNumber) => {
      if (orderNumber) {
        const room = `order_${orderNumber.toUpperCase()}`;
        socket.join(room);
      }
    });

    // Join admin dashboard room
    socket.on('join:admin', () => {
      socket.join('admin_room');
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};

// Notification helper functions
const emitNewOrder = (order) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit('order:new', order);
  }
};

const emitOrderStatusUpdate = (order) => {
  if (ioInstance) {
    const room = `order_${order.orderNumber.toUpperCase()}`;
    ioInstance.to(room).emit('order:updated', order);
    ioInstance.to('admin_room').emit('order:status_updated', order);
  }
};

const emitTableUpdate = (table) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit('table:updated', table);
    ioInstance.emit('public:table_updated', table);
  }
};

const emitBillUpdate = (billData) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit('bill:updated', billData);
    if (billData.orderNumber) {
      ioInstance.to(`order_${billData.orderNumber.toUpperCase()}`).emit('bill:updated', billData);
    }
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitTableUpdate,
  emitBillUpdate,
};
