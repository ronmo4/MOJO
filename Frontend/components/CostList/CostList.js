import React from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import CustomInput from '../CustomInput';
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // ייבוא האייקונים

const CostList = ({ eventCosts, onUpdateCost, isEditing,onDeleteCost}) => {
  return (
    <ScrollView style={styles.listContainer}>
        {Object.entries(eventCosts).map(([key, { label, cost }]) => (
            <TouchableOpacity key={key} style={styles.card} activeOpacity={1}>
                
                {isEditing && (
                    <TouchableOpacity onPress={() => onDeleteCost(key)} style={styles.deleteButton}>
                        <Icon name="trash-can-outline" size={24} color="red" />
                    </TouchableOpacity>
                    )}
                
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => onUpdateCost(key, { cost: text })}
                    value={cost.toString()} 
                    keyboardType="numeric"
                    placeholder="הכנס סכום"
                />
                
                {isEditing ? (
                    <CustomInput
                    value={label}
                    setValue={(text) => onUpdateCost(key, { label: text })}
                    validators={[{ type: 'MINLENGTH', val: 1 }, { type: 'REQUIRE' }]}
                    errorMessage="הכנס שדה חוקי"
                    style={styles.inputLabel}
                />
                ) : (
                    <Text style={styles.cardTitle}>{label}</Text>
                )}

            </TouchableOpacity>
        ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    width: '100%',
  },
  card: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#000',
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right'
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 10,
    width: 80,
    marginLeft: 10,
    textAlign: 'right',
  },
  inputLabel: {
    borderColor: '#cccccc',
    width: '82%', 
    textAlign: 'right',
  }
});

export default CostList;