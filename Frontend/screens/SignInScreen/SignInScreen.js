import React, { useState } from "react";
import { View, Image, StyleSheet, useWindowDimensions, ScrollView } from "react-native";

import Logo from '../../assets/images/mojo_logo.png';
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import SocialSignInButtons from "../../components/SocialSignInButtons";

import { useNavigation } from "@react-navigation/native";
import { apiUrl } from "../../api";
import { saveToken } from "../../util/authToken"; 

const SignInScreen = () => {
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const { height } = useWindowDimensions();
    const navigation = useNavigation();

    const onSignInPress = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'התחברות נכשלה.');
            }

            if (responseData.navigateTo === 'ConfirmEmail') {
                navigation.navigate("ConfirmEmail", { email: responseData.email });
            } else {
                await saveToken(responseData.token); 
                navigation.navigate("HomeScreen");
            }
        } catch (error) {
            console.error('Error:', error.message || 'משהו השתבש במהלך ההתחברות.');
        }
    };

    const onForgotPasswordPress = () => {
        navigation.navigate('ForgotPassword');
    }

    const onSignUpPress = () => {
        navigation.navigate('SignUp');
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={signInStyles.container}>
                <Image
                 source={Logo}
                 style={[signInStyles.logo,{height: height * 0.3}]}
                 />
                 
                 <CustomInput 
                 iconName="account"
                 placeholder="שם משתמש" 
                 value={username} 
                 setValue={setUserName}
                 validators={[{ type: 'MINLENGTH', val: 3 }, { type: 'REQUIRE' }]}
                 errorMessage="שם המשתמש חייב להיות בעל 3 תווים לפחות"
                />

                 <CustomInput 
                 iconName="lock-outline"
                 placeholder="סיסמא" 
                 value={password} 
                 setValue={setPassword} 
                 secureTextEntry={true} 
                 validators={[{ type: 'MINLENGTH', val: 8 }, { type: 'REQUIRE' }]}
                 errorMessage="הסיסמה חייבת להיות באורך של 8 תווים לפחות"
                 />

                 <CustomButton 
                 text="התחברות" 
                 onPress={onSignInPress}
                 />

                 <CustomButton 
                 text="שכחת סיסמא?" 
                 onPress={onForgotPasswordPress} 
                 type="TERTIARY"
                 />

                 <SocialSignInButtons/>

                <CustomButton 
                 text="אין לך חשבון? צור אחד חדש" 
                 onPress={onSignUpPress} 
                 type="TERTIARY"
                 />

            </View>
        </ScrollView>
    );
    
};

const signInStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20
    },
    logo: {
        maxHeight: 200,
        maxWidth: 200,
        resizeMode: 'contain'
    },
});

export default SignInScreen;
