import React from 'react';
import renderer from 'react-test-renderer';
import MacroCard from '../MacroCard';

describe('MacroCard', () => {
  it('renders correctly with all props', () => {
    const tree = renderer.create(
      <MacroCard 
        title="Protein"
        current={65}
        goal={120}
        unit="g"
        bgColor="bg-blue-100"
        progressColor="#3b82f6"
        textColor="text-blue-800"
      />
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
  
  it('renders correctly when goal is reached', () => {
    const tree = renderer.create(
      <MacroCard 
        title="Carbs"
        current={200}
        goal={200}
        unit="g"
        bgColor="bg-green-100"
        progressColor="#22c55e"
        textColor="text-green-800"
      />
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
}); 