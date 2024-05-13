class defaultSetting():
    def __init__(self):
        self.username = None
        self.password = None

def getSettingsName(username, password):
    # TODO : add number to unique name
    return username + password + 'settings'

def getCardSetName(username, password, setName):
    # # TODO : add number to unique name
    return username + password + setName

def getDefaultSettings():
    return "{\"username\": None, \"password\": None}"
    # return {key:value for key, value in defaultSetting.__dict__.items() if not key.startswith('__') and not callable(key)}