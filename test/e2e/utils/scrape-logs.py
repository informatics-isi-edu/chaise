def readDataFromFile(fileName):
    dataDict = {}
    with open(fileName, 'rb') as dataFile:
        dataReader = csv.reader(dataFile)
        i = 0
        for row in dataReader:
            if i == 0:
                i += 1
                continue

            key = stripSpecialChars(row[1])

            # if we have a row for the player already, check if the existing one is TOT and replace if it isn't
            # NOTE: from looking at the data, TOT should be the first row for a player if player has multiple entries
            if key in dataDict:
                if dataDict[key][3] == 'TOT':
                    continue

            dataDict[key] = row
        dataFile.closed

    return dataDict
