import EventEmitter from 'ev-emitter'
import Fold from './fold'

let ID_COUNTER = 0

export default class Handorgel extends EventEmitter {
  constructor(element, options = {}) {
    super()

    if (element.handorgel) {
      return
    }

    this.element = element
    this.element.handorgel = this
    this.id = `handorgel${++ID_COUNTER}`
    this.element.setAttribute('id', this.id)
    this.folds = []
    this.options = Object.assign({}, Handorgel.defaultOptions, options)

    this._listeners = {}

    this._bindEvents()
    this.update()
  }

  update() {
    this.folds = []

    const headerElements =
      typeof this.options.headerElements === 'string'
        ? this.element.querySelectorAll(this.options.headerElements)
        : this.options.headerElements

    const contentElements =
      typeof this.options.contentElements === 'string'
        ? this.element.querySelectorAll(this.options.contentElements)
        : this.options.contentElements

    for (let i = 0; i < headerElements.length; i = i + 1) {
      // get fold instance if there is already one
      let fold = headerElements[i].handorgelFold

      // create new one when header and content exist
      if (!fold && headerElements[i] && contentElements[i]) {
        fold = new Fold(this, headerElements[i], contentElements[i])
      }

      if (fold) {
        this.folds.push(fold)
      }
    }
  }

  focus(target) {
    const foldsLength = this.folds.length
    let currentFocusedIndex = null

    for (let i = 0; i < foldsLength && currentFocusedIndex === null; i++) {
      if (this.folds[i].focused) currentFocusedIndex = i
    }

    if ((target === 'prev' || target === 'next') && currentFocusedIndex === null) {
      target = target === 'prev' ? 'last' : 'first'
    }

    if (target === 'prev' && currentFocusedIndex === 0) {
      if (!this.options.carouselFocus) return
      target = 'last'
    }

    if (target === 'next' && currentFocusedIndex === foldsLength - 1) {
      if (!this.options.carouselFocus) return
      target = 'first'
    }

    switch (target) {
      case 'prev':
        this.folds[--currentFocusedIndex].focus()
        break
      case 'next':
        this.folds[++currentFocusedIndex].focus()
        break
      case 'last':
        this.folds[foldsLength - 1].focus()
        break
      case 'first':
      default:
        this.folds[0].focus()
    }
  }

  destroy() {
    this.emitEvent('destroy')
    this.element.removeAttribute('id')

    this.folds.forEach(fold => {
      fold.destroy()
    })

    this._unbindEvents()

    // clean reference to handorgel instance
    this.element.handorgel = null
    this.emitEvent('destroyed')
  }

  _handleFoldOpen(openFold) {
    if (this.options.multiSelectable) {
      return
    }

    this.folds.forEach(fold => {
      if (openFold !== fold) {
        fold.close()
      }
    })
  }

  _bindEvents() {
    this._listeners.foldOpen = this._handleFoldOpen.bind(this)
    this.on('fold:open', this._listeners.foldOpen)
  }

  _unbindEvents() {
    this.off('fold:open', this._listeners.foldOpen)
  }
}

Handorgel.defaultOptions = {
  keyboardInteraction: true,
  multiSelectable: true,
  ariaEnabled: true,
  collapsible: true,
  carouselFocus: true,

  initialOpenAttribute: 'data-open',
  initialOpenTransition: true,
  initialOpenTransitionDelay: 200,

  headerElements: '.handorgel__header',
  contentElements: '.handorgel__content',

  headerOpenClass: 'handorgel__header--open',
  contentOpenClass: 'handorgel__content--open',

  headerOpenedClass: 'handorgel__header--opened',
  contentOpenedClass: 'handorgel__content--opened',

  headerDisabledClass: 'handorgel__header--disabled',
  contentDisabledClass: 'handorgel__content--disabled',

  headerFocusClass: 'handorgel__header--focus',
  contentFocusClass: 'handorgel__content--focus'
}
