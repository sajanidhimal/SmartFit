import React from 'react';
import renderer, { act } from 'react-test-renderer';
import WeekCalendar from '../WeekCalendar';

describe('WeekCalendar', () => {
  const mockWeekDays = [
    { day: 'Mon', date: 1, active: false },
    { day: 'Tue', date: 2, active: true },
    { day: 'Wed', date: 3, active: false },
    { day: 'Thu', date: 4, active: false },
    { day: 'Fri', date: 5, active: false },
    { day: 'Sat', date: 6, active: false },
    { day: 'Sun', date: 7, active: false },
  ];
  
  const mockOnPrevWeek = jest.fn();
  const mockOnNextWeek = jest.fn();
  const mockOnSelectDay = jest.fn();
  
  beforeEach(() => {
    // Clear mocks before each test
    mockOnPrevWeek.mockClear();
    mockOnNextWeek.mockClear();
    mockOnSelectDay.mockClear();
  });
  
  it('renders correctly with provided days', () => {
    const tree = renderer.create(
      <WeekCalendar 
        weekDays={mockWeekDays}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
        onSelectDay={mockOnSelectDay}
      />
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
  
  it('calls onPrevWeek when the left chevron is pressed', () => {
    const component = renderer.create(
      <WeekCalendar 
        weekDays={mockWeekDays}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
        onSelectDay={mockOnSelectDay}
      />
    );
    
    const prevButton = component.root.findAllByProps({ name: 'chevron-back' })[0]
      .parent.parent;
      
    act(() => {
      prevButton.props.onPress();
    });
    
    expect(mockOnPrevWeek).toHaveBeenCalledTimes(1);
  });
  
  it('calls onNextWeek when the right chevron is pressed', () => {
    const component = renderer.create(
      <WeekCalendar 
        weekDays={mockWeekDays}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
        onSelectDay={mockOnSelectDay}
      />
    );
    
    const nextButton = component.root.findAllByProps({ name: 'chevron-forward' })[0]
      .parent.parent;
      
    act(() => {
      nextButton.props.onPress();
    });
    
    expect(mockOnNextWeek).toHaveBeenCalledTimes(1);
  });
  
  it('calls onSelectDay with the correct index when a day is pressed', () => {
    const component = renderer.create(
      <WeekCalendar 
        weekDays={mockWeekDays}
        onPrevWeek={mockOnPrevWeek}
        onNextWeek={mockOnNextWeek}
        onSelectDay={mockOnSelectDay}
      />
    );
    
    // Find all day touchables and press the third one (index 2)
    const dayButtons = component.root.findAllByProps({ 
      className: "items-center"
    });
    
    act(() => {
      dayButtons[2].props.onPress();
    });
    
    expect(mockOnSelectDay).toHaveBeenCalledWith(2);
  });
}); 