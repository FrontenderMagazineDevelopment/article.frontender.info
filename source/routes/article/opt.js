export async function opt(req, res) {
  const methods = ['OPTIONS', 'GET', 'PUT', 'PATCH', 'DELETE'];
  const method = req.header('Access-Control-Request-Method');
  res.setHeader('Access-Control-Allow-Methods', methods.join(','));
  res.setHeader('Allow', methods.join(','));
  if (methods.indexOf(method) === -1) {
    res.status(405);
    res.end();
    return;
  }
  res.status(200);
  res.end();
}

export default opt;
