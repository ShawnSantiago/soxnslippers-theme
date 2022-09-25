import { debounce, fetchConfig } from '@/lib/utils'

export default class CartItems extends window.HTMLElement {
  constructor () {
    super()

    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus')

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0)

    this.debouncedOnChange = debounce(event => {
      this.onChange(event)
    }, 300)

    this.addEventListener('change', this.debouncedOnChange)
  }

  onChange (event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'))
  }

  getSectionsToRender () {
    return [
    ]
  }

  updateQuantity (line, quantity, name) {
    this.enableLoading(line)

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map(section => section.section),
      sections_url: window.location.pathname
    })

    fetch(`${window.routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then(response => {
        return response.text()
      })
      .then(state => {
        const parsedState = JSON.parse(state)
        this.classList.toggle('is-empty', parsedState.item_count === 0)
        const cartDrawerWrapper = document.querySelector('cart-drawer')

        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0)

        this.getSectionsToRender().forEach(section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id)
          elementToReplace.innerHTML =
            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector)
        })

        this.updateLiveRegions(line, parsedState.item_count)
        this.disableLoading()
      })
      .catch(() => {
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors')
        errors.textContent = window.cartStrings.error
        this.disableLoading()
      })
  }

  updateLiveRegions (line, itemCount) {
    if (this.currentItemCount === itemCount) {
      const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`)
      const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`)
      lineItemError
        .innerHTML = window.cartStrings.quantityError.replace(
          '[quantity]',
          quantityElement.value
        )
    }

    this.currentItemCount = itemCount
    this.lineItemStatusElement.setAttribute('aria-hidden', true)

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText')
    cartStatus.setAttribute('aria-hidden', false)

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true)
    })
  }

  getSectionInnerHTML (html, selector) {
    return new window.DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML
  }

  enableLoading (line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems')
    mainCartItems.classList.add('loading')

    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`)

    cartDrawerItemElements.forEach((overlay) => overlay.classList.remove('hidden'))

    document.activeElement.blur()
    this.lineItemStatusElement.setAttribute('aria-hidden', false)
  }

  disableLoading () {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems')
    mainCartItems.classList.remove('loading')
  }
}

window.customElements.define('cart-items', CartItems)