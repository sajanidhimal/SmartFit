
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, Dimensions } from 'react-native';

const BMICalculator = () => {
  const [screen, setScreen] = useState('input'); // 'input' or 'result'
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInch, setHeightInch] = useState(7);
  const [weight, setWeight] = useState(55);
  const [age, setAge] = useState(23);
  const [gender, setGender] = useState('Male');
  const [bmi, setBmi] = useState(19);

  // Animated values for smoother transitions
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  // Scroll refs for programmatic scrolling
  const feetScrollRef = useRef<ScrollView>(null);
  const inchScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);

  const ITEM_HEIGHT = 50;
  const VISIBLE_ITEMS = 3;

  const calculateBMI = () => {
    // Animate transition
    Animated.sequence([
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        delay: 100
      })
    ]).start();

    // Convert height to meters: (feet * 0.3048) + (inches * 0.0254)
    const heightInMeters = (heightFeet * 0.3048) + (heightInch * 0.0254);
    // Calculate BMI: weight(kg) / height(m)^2
    const calculatedBMI = weight / (heightInMeters * heightInMeters);
    
    // Round to 1 decimal place
    setBmi(Math.round(calculatedBMI * 10) / 10);
    
    setTimeout(() => setScreen('result'), 300);
  };

  // Helper function to ensure scroll snaps to the exact center of an item
  const snapToItem = (scrollRef: React.RefObject<ScrollView>, index: number, itemsArray: string | any[]) => {
    if (scrollRef.current && index >= 0 && index < itemsArray.length) {
      scrollRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  const renderDialInput = (values: any[], selectedValue: number, onValueChange: { (value: React.SetStateAction<number>): void; (value: React.SetStateAction<number>): void; (value: React.SetStateAction<number>): void; (arg0: any): void; }, scrollRef: React.RefObject<ScrollView>) => {
    // Find the index of the selected value
    const selectedIndex = values.indexOf(selectedValue);
    
    return (
      <View className="h-40 overflow-visible relative">
        <View className="absolute left-0 right-0 top-1/2 h-14 bg-orange-50 rounded-xl border-2 border-orange-300 z-0 -translate-y-7" />
        
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ 
            paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)
          }}
          onMomentumScrollEnd={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / ITEM_HEIGHT);
            if (index >= 0 && index < values.length) {
              onValueChange(values[index]);
            }
          }}
          scrollEventThrottle={16}
          contentInset={{ top: selectedIndex * ITEM_HEIGHT, bottom: selectedIndex * ITEM_HEIGHT, left: 0, right: 0 }}
        >
          {values.map((value: boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.Key | null | undefined, index: any) => (
            <TouchableOpacity
              key={String(value)}
              className={`h-12 justify-center items-center my-1`}
              onPress={() => {
                snapToItem(scrollRef, index, values);
                onValueChange(value);
              }}
            >
              <Text 
                className={`text-lg ${value === selectedValue 
                  ? 'font-bold text-orange-500 scale-110' 
                  : Math.abs(values.indexOf(value) - values.indexOf(selectedValue)) === 1 
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {String(value)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Lines for visual cue */}
        <View className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
      </View>
    );
  };

  // Set initial scroll positions
  useEffect(() => {
    // Create arrays for each dial
    const feetValues = Array.from({ length: 10 }, (_, i) => i + 1); // 1-10 feet
    const inchValues = Array.from({ length: 12 }, (_, i) => i); // 0-11 inches
    const weightValues = Array.from({ length: 150 }, (_, i) => i + 30); // 30-179kg
    
    // Set initial scroll positions after a short delay to ensure refs are set
    setTimeout(() => {
      snapToItem(feetScrollRef, feetValues.indexOf(heightFeet), feetValues);
      snapToItem(inchScrollRef, inchValues.indexOf(heightInch), inchValues);
      snapToItem(weightScrollRef, weightValues.indexOf(weight), weightValues);
    }, 300);
  }, []);

  const renderInputScreen = () => {
    const feetValues = Array.from({ length: 10 }, (_, i) => i + 1); // 1-10 feet
    const inchValues = Array.from({ length: 12 }, (_, i) => i); // 0-11 inches
    const weightValues = Array.from({ length: 150 }, (_, i) => i + 30); // 30-179kg

    return (
      <Animated.View 
        className="flex-1"
        style={{ opacity: animatedOpacity }}
      >
        <View className="w-full bg-white rounded-xl mb-5 p-5 shadow-md">
          <Text className="text-xl font-bold mb-2 text-orange-500">What's your height?</Text>
          <Text className="text-sm text-gray-500 mb-5">
            This is used in making personalized results and plan for you.
          </Text>
          
          <View className="flex-row items-center justify-center bg-gray-50 rounded-xl p-4">
            <View className="w-16">
              {renderDialInput(feetValues, heightFeet, setHeightFeet, feetScrollRef)}
            </View>
            <Text className="mx-2 text-lg font-bold">ft</Text>
            <View className="w-16">
              {renderDialInput(inchValues, heightInch, setHeightInch, inchScrollRef)}
            </View>
            <Text className="mx-2 text-lg font-bold">in</Text>
          </View>
        </View>

        <View className="w-full bg-white rounded-xl mb-5 p-5 shadow-md">
          <Text className="text-xl font-bold mb-2 text-orange-500">What's your Weight?</Text>
          <Text className="text-sm text-gray-500 mb-5">
            This is used in making personalized results and plan for you.
          </Text>
          
          <View className="items-center bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center">
              <View className="w-20">
                {renderDialInput(weightValues, weight, setWeight, weightScrollRef)}
              </View>
              <Text className="text-lg font-bold ml-4">kg</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          className="w-full h-14 bg-orange-500 justify-center items-center rounded-xl mt-5 shadow-md"
          onPress={calculateBMI}
        >
          <Text className="text-white text-lg font-bold">Calculate BMI</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Helper function to determine the rotation angle of the gauge needle based on BMI
  const getNeedleRotation = () => {
    // Normalize BMI to get a rotation value between -90 and 90 degrees
    const minBMI = 10; // lowest BMI value on gauge
    const maxBMI = 40; // highest BMI value on gauge
    const rangeInDegrees = 180; // -90 to 90
    
    const normalizedBMI = Math.max(minBMI, Math.min(bmi, maxBMI));
    const rotationPercentage = (normalizedBMI - minBMI) / (maxBMI - minBMI);
    return -90 + (rotationPercentage * rangeInDegrees);
  };

  // Helper function to determine BMI category
  const getBMICategory = () => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500", bgColor: "bg-blue-100" };
    if (bmi < 25) return { category: "Normal", color: "text-green-500", bgColor: "bg-green-100" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500", bgColor: "bg-yellow-100" };
    if (bmi < 35) return { category: "Obese", color: "text-orange-500", bgColor: "bg-orange-100" };
    return { category: "Extremely Obese", color: "text-red-500", bgColor: "bg-red-100" };
  };

  // Helper function to get advice based on BMI
  const getBMIAdvice = () => {
    const category = getBMICategory().category;
    
    switch(category) {
      case "Underweight":
        return "Your BMI suggests you're underweight. Focus on nutritious, calorie-dense foods and consider consulting with a healthcare provider for a personalized plan to gain weight healthily.";
      case "Normal":
        return "Great job! Your weight is in the normal range. Keep maintaining your healthy habits with a balanced diet and regular exercise to stay on track.";
      case "Overweight":
        return "Your BMI suggests you're overweight. Consider moderate lifestyle changes including a balanced diet and regular physical activity to gradually move toward a healthier weight.";
      case "Obese":
        return "Your BMI falls within the obese category. It's recommended to consult with healthcare professionals for guidance on creating a sustainable plan for weight management through diet, exercise, and potential medical interventions.";
      case "Extremely Obese":
        return "Your BMI indicates severe obesity. Please consult with healthcare professionals for comprehensive support and guidance. A personalized plan including medical supervision, nutrition counseling, and appropriate physical activity may be beneficial.";
      default:
        return "Maintain a balanced diet and regular exercise routine for optimal health.";
    }
  };

  // Calculate ideal weight range based on height (18.5-24.9 BMI range)
  const getIdealWeightRange = () => {
    const heightInMeters = (heightFeet * 0.3048) + (heightInch * 0.0254);
    const minIdealWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const maxIdealWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);
    return `${minIdealWeight} - ${maxIdealWeight} kg`;
  };

  // Calculate distance from ideal weight
  const getWeightDifference = () => {
    const heightInMeters = (heightFeet * 0.3048) + (heightInch * 0.0254);
    const midIdealWeight = (21.7 * heightInMeters * heightInMeters); // Middle of normal BMI range
    
    if (getBMICategory().category === "Normal") {
      return "Within Range";
    }
    
    const difference = (weight - midIdealWeight).toFixed(1);
    const diffNumber = parseFloat(difference);
    return (diffNumber > 0 ? "+" : "") + difference + " kg";
  };

  const renderResultScreen = () => {
    const bmiCategory = getBMICategory();
    
    return (
      <Animated.View 
        className="flex-1 items-center pb-16"
        style={{ opacity: animatedOpacity }}
      >
        <Text className="text-2xl font-bold text-orange-500 my-5">Your BMI Result</Text>
        
        {/* Gauge Display */}
<View className="w-80 h-40 my-5 relative overflow-hidden">
    {/* Semi-circular gauge background */}
    <View className="w-full h-40 overflow-hidden rounded-t-full flex-row">
        <View className="flex-1 h-full bg-blue-400" />
        <View className="flex-1 h-full bg-green-500" />
        <View className="flex-1 h-full bg-yellow-400" />
        <View className="flex-1 h-full bg-orange-500" />
        <View className="flex-1 h-full bg-red-600" />
    </View>
    
    {/* Improved gauge labels with better contrast */}
    <View className="absolute top-0 left-0 right-0 h-40 flex-row">
        <View className="flex-1 items-center pt-8">
            <View className="bg-white bg-opacity-70 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-blue-600">Under</Text>
                <Text className="text-xs text-blue-600">{'<18.5'}</Text>
            </View>
        </View>
        <View className="flex-1 items-center pt-8">
            <View className="bg-white bg-opacity-70 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-green-600">Normal</Text>
                <Text className="text-xs text-green-600">18.5-24.9</Text>
            </View>
        </View>
        <View className="flex-1 items-center pt-8">
            <View className="bg-white bg-opacity-70 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-yellow-600">Over</Text>
                <Text className="text-xs text-yellow-600">25-29.9</Text>
            </View>
        </View>
        <View className="flex-1 items-center pt-8">
            <View className="bg-white bg-opacity-70 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-orange-600">Obese</Text>
                <Text className="text-xs text-orange-600">30-34.9</Text>
            </View>
        </View>
        <View className="flex-1 items-center pt-8">
            <View className="bg-white bg-opacity-70 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-red-600">Extreme</Text>
                <Text className="text-xs text-red-600">{'>35'}</Text>
            </View>
        </View>
    </View>
    
    {/* Fixed Gauge needle - properly anchored at bottom */}
    <View 
        className="absolute bottom-0 left-1/2 top-1/2 w-2 h-[120px] bg-gray-800 origin-bottom"
        style={{ 
            transform: [
                { translateX: -1 }, // Half of width to center
                { rotate: `${getNeedleRotation()}deg` }
            ]
        }}
    />
    
    {/* Gauge center point - fixed to stay in place */}
    <View className="absolute bottom-0 left-1/2 w-6 h-6 rounded-full bg-gray-800 transform -translate-x-3" />
    
    {/* BMI value on gauge */}
    <View className="absolute bottom-6 left-1/2 transform -translate-x-6 bg-white rounded-full shadow-md w-12 h-12 items-center justify-center">
        <Text className="text-sm font-bold text-orange-500">{bmi}</Text>
    </View>
</View>
        
        <View className="w-full px-4">
          <View className="bg-white rounded-xl p-6 shadow-md items-center mb-5">
            <Text className="text-3xl font-bold text-orange-500">{bmi} kg/m²</Text>
            <View className={`mt-2 px-4 py-1 rounded-full ${bmiCategory.bgColor}`}>
              <Text className={`font-semibold ${bmiCategory.color}`}>{bmiCategory.category}</Text>
            </View>
            <Text className="text-base text-gray-600 mt-4">{heightFeet}ft {heightInch}in | {weight} kg | {gender} | {age} years old</Text>
          </View>
          
          <View className="flex-row w-full justify-between mb-5">
            <View className="bg-white p-4 rounded-xl shadow w-48 items-center">
              <Text className="text-base font-semibold text-gray-600">Ideal Weight Range</Text>
              <Text className="text-base font-bold">{getIdealWeightRange()}</Text>
            </View>
            <View className="bg-white p-4 rounded-xl shadow w-48 items-center">
              <Text className="text-base font-semibold text-gray-600">From Ideal</Text>
              <Text className={`text-base font-bold ${bmiCategory.category === "Normal" ? "text-green-500" : bmi < 18.5 ? "text-blue-500" : "text-orange-500"}`}>
                {getWeightDifference()}
              </Text>
            </View>
          </View>
          
          <View className="bg-white rounded-xl p-6 shadow-md mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-2">Health Advice</Text>
            <Text className="text-base text-gray-600 leading-6">
              {getBMIAdvice()}
            </Text>
          </View>
        </View>
        
        <View className="w-full px-4">
          <TouchableOpacity 
            className="w-full h-14 bg-orange-500 justify-center items-center rounded-xl mt-2 shadow-md"
            onPress={() => {
              // Animate transition back to input
              Animated.sequence([
                Animated.timing(animatedOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true
                }),
                Animated.timing(animatedOpacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                  delay: 100
                })
              ]).start();
              
              setTimeout(() => setScreen('input'), 300);
            }}
          >
            <Text className="text-white text-lg font-bold">Recalculate</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Navigation bar component with improved styling
  const Navbar = () => (
    <View className="w-full h-16 bg-white border-b border-gray-200 flex-row items-center px-4 shadow-sm">
      {screen === 'result' && (
        <TouchableOpacity 
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => {
            // Animate transition back to input
            Animated.sequence([
              Animated.timing(animatedOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(animatedOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
                delay: 100
              })
            ]).start();
            
            setTimeout(() => setScreen('input'), 300);
          }}
        >
          <Text className="text-orange-500 text-2xl">&lt;</Text>
        </TouchableOpacity>
      )}
      <Text className="text-xl font-bold flex-1 text-center text-orange-500">
        {screen === 'input' ? 'Enter your BMI details' : 'BMI Results'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Navbar />
      <ScrollView className="flex-1 px-4 pt-4">
        {screen === 'input' ? renderInputScreen() : renderResultScreen()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BMICalculator;

