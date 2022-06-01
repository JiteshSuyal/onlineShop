const deleteProduct = btn => {
  console.log(btn.parentNode.querySelector('[name=productId]'))
  const prodId = btn.parentNode.querySelector('[name=productId]').value
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value

  const productElement = btn.closest('article')  //gives closest ancestor

  fetch('/admin/product/' + prodId, { //fetch method supported by browser for sending n receiving http request
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
    .then(result => {
      return result.json()
    })
    .then(data => {
      console.log(data)
      productElement.parentNode.removeChild(productElement)
    })
    .catch(err => {
      console.log(err)
    })
}
