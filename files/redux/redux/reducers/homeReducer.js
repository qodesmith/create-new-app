import { randomHexColor } from 'helpers'

const initialState = { color: '#ffd700' }

const homeReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case 'CHANGE_COLOR':
      return { ...state, color: randomHexColor() }
    default:
      return state
  }
}

export default homeReducer
