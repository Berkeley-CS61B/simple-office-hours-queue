export const COURSE_ID = 'CS61B';

export const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export const EMAIL_DOMAIN_REGEX_OR_EMPTY = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})|^$/;

export const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export const DARK_MODE_COLOR = '#121212';

export const DARK_GRAY_COLOR = '#222222';

export const DARK_HOVER_COLOR = '#2f2f2f';

export const STARTER_DEBUGGING_TICKET_DESCRIPTION = `1. What test(s) are currently failing? What is the error message you see, and what information do you get from the failed tests?\n\n
2. In the function that may be buggy, please explain your current logic (be as descriptive as possible). Which location(s) do you think are causing the bug?\n\n
3. How have you tried debugging so far (writing code in a main method, print statements, using the debugger)? Please elaborate on the steps you have taken and observation you made.\n\n`;

export const STARTER_CONCEPTUAL_TICKET_DESCRIPTION = 'Conceptual question about [this concept]';
