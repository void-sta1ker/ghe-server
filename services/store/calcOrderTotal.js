const calcOrderTotal = (order) => {
  const total = order.products
    .filter((item) => item.status !== "Cancelled")
    .reduce((sum, current) => sum + current.totalPrice, 0);

  return total;
};

module.exports = calcOrderTotal;
