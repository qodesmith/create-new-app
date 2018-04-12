import { randomHexColor } from '../helpers'

const initialState = {
  title: 'Create New App',
  author: 'the Qodesmith',
  color: '#ffd700'
}

const exampleReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case 'CHANGE_COLOR':
      return { ...state, color: randomHexColor() }
    default:
      return state
  }
}

export default exampleReducer
