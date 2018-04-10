const initialState = {
  title: 'Create New App',
  author: 'the Qodesmith',
  color: '#ffd700'
};

const letters = ['a' ,'b' ,'c' ,'d' ,'e' ,'f'];
const numbers = [...Array(10).keys()];
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomHexColor = (hex = '') => {
  if (hex.length === 6) return `#${hex}`;

  const arr = randomNum(0,1) ? letters : numbers;
  const num = randomNum(0, arr.length - 1);

  return randomHexColor(`${hex}${arr[num]}`);
}

export const exampleReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case 'CHANGE_COLOR':
      return { ...state, color: randomHexColor() };
    default:
      return state;
  }
};
