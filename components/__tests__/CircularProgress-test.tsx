import React from 'react';
import renderer from 'react-test-renderer';
import CircularProgress from '../CircularProgress';

describe('CircularProgress', () => {
  it('renders correctly with provided props', () => {
    const tree = renderer.create(
      <CircularProgress 
        size={100}
        strokeWidth={10}
        progress={75}
        max={100}
        value={75}
        unit="kg"
        color="#f8a100"
      />
    ).toJSON();
    
    expect(tree).toBeTruthy();
  });
  
  it('calculates progress correctly', () => {
    const testRenderer = renderer.create(
      <CircularProgress 
        size={100}
        strokeWidth={10}
        progress={50}
        max={100}
        value={50}
        unit="%"
        color="#f8a100"
      />
    );
    
    const testInstance = testRenderer.root;
    
    // Find the second Circle which is the progress circle
    const progressCircle = testInstance.findAllByType('Circle')[1];
    
    // The radius is (size - strokeWidth) / 2 = (100 - 10) / 2 = 45
    // The circumference is radius * 2 * PI = 45 * 2 * PI ≈ 282.74
    // For 50% progress (50/100), svgProgress should be 100 - 50 = 50
    // So strokeDashoffset should be circum * (50/100) ≈ 141.37
    
    expect(progressCircle.props.strokeDashoffset).toBeCloseTo(141.37, 1);
  });
}); 