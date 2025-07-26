import { supabase } from './supabase.js';

/**
 * Check if a user with the given email already exists in the database
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
export async function checkEmailExists(email) {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected when email doesn't exist
      console.error('Error checking email existence:', error);
      throw error;
    }

    return !!data; // Returns true if data exists, false if not found
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    throw error;
  }
}

/**
 * Hash an email address using a simple hash function
 * @param {string} email - The email address to hash
 * @returns {string} - The hashed email
 */
function hashEmail(email) {
  let hash = 0;
  if (email.length === 0) return hash.toString();
  
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString();
}

/**
 * Sign up a new user with email and password
 * @param {string} email - The user's email address
 * @param {string} password - The user's password (will be stored as-is, not hashed)
 * @returns {Promise<Object>} - Result object with success status and message
 */
export async function signUpUser(email, password) {
  try {
    // First, check if user already exists
    const userExists = await checkEmailExists(email);
    
    if (userExists) {
      console.log("user already exists");
      return {
        success: false,
        message: "User already exists",
        error: "DUPLICATE_EMAIL"
      };
    }

    // Hash the email for storage
    const hashedEmail = hashEmail(email);
    
    // Store user in database
    const { data, error } = await supabase
      .from('Users')
      .insert([
        {
          email: email,
          'Hashed Password': password, // Store password as-is (not hashed as requested)
          'Encrypted Email': hashedEmail,
          isPro: false // Default to non-pro user
        }
      ]);

    if (error) {
      console.error('Error inserting user:', error);
      return {
        success: false,
        message: "Failed to create user",
        error: error.message
      };
    }

    console.log('User created successfully:', data);
    return {
      success: true,
      message: "User created successfully",
      data: data
    };

  } catch (error) {
    console.error('Error in signUpUser:', error);
    return {
      success: false,
      message: "An error occurred during signup",
      error: error.message
    };
  }
}

/**
 * Get all users from the database (for testing purposes)
 * @returns {Promise<Array>} - Array of all users
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
} 