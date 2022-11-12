import { Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
/**
 * Countdown component that displays the time remaining for a ticket.
 * Used for absent tickets and general time remaining.
 */
interface CountdownProps {
  initialTimeInMs: number;
}

const Countdown = (props: CountdownProps) => {
  const { initialTimeInMs } = props;
  const [timeRemaining, setTimeRemaining] = useState(initialTimeInMs);
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = ((timeRemaining % 60000) / 1000).toFixed(0);

  // Update the time remaining every second
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeRemaining]);

  // If the time remaining is less than 0, return 0
  if (timeRemaining < 0) {
    return <span>0:00</span>;
  }
  return (
    <Text fontWeight='bold' fontSize='xl'>
      {minutes}:{parseInt(seconds) < 10 ? '0' : ''}
      {seconds}
    </Text>
  );
};

export default Countdown;
