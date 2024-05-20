const formatOrders = (orders) => {
  const newOrders = orders.map((order) => {
    return {
      id: order._id,
      user: order.user,
      total: parseFloat(Number(order.total.toFixed(2))),
      created: order.created,
      products: order?.cart?.products,
      cart: order?.cart._id,
    };
  });

  return newOrders.map((order) => {
    // return order?.products ? this.caculateTaxAmount(order) : order;
    return order;
  });
};

module.exports = formatOrders;
