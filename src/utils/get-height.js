

function stringToInches(feetString, inchesString) {
    const feet = parseInt(feetString);
    const inches = parseInt(inchesString);
    return feet * 12 + inches;
}


function inchesToFeetAndInches(totalHeightInInches) {
    const feet = Math.floor(totalHeightInInches / 12); // Get the whole number of feet
    const inches = totalHeightInInches % 12; // Get the remaining inches

    return `${feet}'${inches}''`; // Format the result as feet and inches
}

function inchesToSapratedFeetANDInches(totalHeightInInches) {
    const feet = Math.floor(totalHeightInInches / 12); // Get the whole number of feet
    const inches = totalHeightInInches % 12; // Get the remaining inches

    return {
        feet,
        inches
    } // Format the result as feet and inches
}


module.exports = { stringToInches, inchesToFeetAndInches, inchesToSapratedFeetANDInches };