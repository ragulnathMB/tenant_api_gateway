const { getUserDBPool, getTenantDBPool, sql } = require('../config/database');

class TenantService {
  async createTenant(tenantData) {
    const {
      TenantID,
      Name,
      Licence_Count = 0,
      License_Type = null,
      Enabled_Users_Count = 0,
      Disabled_Users_Count = 0,
      License_Expiry = null,
      Admin_ID = null,
      Password = null,
    } = tenantData;

    if (!TenantID || !Name) {
      throw new Error('TenantID and Name are required');
    }

    const pool = getTenantDBPool();
    await pool.request()
      .input('TenantID', sql.VarChar(50), TenantID)
      .input('Name', sql.NVarChar(200), Name)
      .input('Licence_Count', sql.Int, Licence_Count)
      .input('License_Type', sql.VarChar(100), License_Type)
      .input('Enabled_Users_Count', sql.Int, Enabled_Users_Count)
      .input('Disabled_Users_Count', sql.Int, Disabled_Users_Count)
      .input('License_Expiry', sql.Date, License_Expiry)
      .input('Admin_ID', sql.VarChar(100), Admin_ID)
      .input('Password', sql.NVarChar(512), Password)
      .query(`
        INSERT INTO dbo.TenantInfo 
          (TenantID, Name, Licence_Count, License_Type, Enabled_Users_Count, Disabled_Users_Count, License_Expiry, Admin_ID, Password)
        VALUES 
          (@TenantID, @Name, @Licence_Count, @License_Type, @Enabled_Users_Count, @Disabled_Users_Count, @License_Expiry, @Admin_ID, @Password)
      `);

    return { message: 'Tenant created successfully' };
  }

  async getTenantById(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT * FROM dbo.TenantInfo WHERE TenantID = @tenantId');

    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = result.recordset[0];
    return {
      TenantID: tenant.TenantID,
      Name: tenant.Name,
      Licence_Count: tenant.Licence_Count,
      License_Type: tenant.License_Type,
      Enabled_Users_Count: tenant.Enabled_Users_Count,
      Disabled_Users_Count: tenant.Disabled_Users_Count,
      License_Expiry: tenant.License_Expiry,
      Admin_ID: tenant.Admin_ID,
      Password: tenant.Password
    };
  }

  async getAllTenants() {
    const tenantPool = getTenantDBPool();
    const userPool = getUserDBPool();

    // Get all tenants
    const result = await tenantPool.request().query('SELECT * FROM dbo.TenantInfo');
    const tenants = result.recordset;

    // Get enabled/disabled users count grouped by TenantID
    const userCountResult = await userPool.request().query(`
      SELECT TenentID, Status, COUNT(*) AS Count
      FROM dbo.Users
      GROUP BY TenentID, Status
    `);

    // Organize counts into a map
    const countsMap = {};
    userCountResult.recordset.forEach(row => {
      const tenantId = row.TenantID;
      const status = (row.Status || '').toLowerCase();
      const count = row.Count || 0;

      if (!countsMap[tenantId]) {
        countsMap[tenantId] = { enabled: 0, disabled: 0 };
      }

      if (status === 'enabled') {
        countsMap[tenantId].enabled = count;
      } else if (status === 'disabled') {
        countsMap[tenantId].disabled = count;
      }
    });

    // Merge counts into tenants array
    return tenants.map(row => ({
      TenantID: row.TenantID,
      Name: row.Name,
      Licence_Count: row.Licence_Count,
      License_Type: row.License_Type,
      Enabled_Users_Count: countsMap[row.TenantID]?.enabled || 0,
      Disabled_Users_Count: countsMap[row.TenantID]?.disabled || 0,
      License_Expiry: row.License_Expiry,
      Admin_ID: row.Admin_ID
    }));
  }

  async updateTenantInfo(tenantId, updateData) {
    const {
      Name,
      Licence_Count,
      License_Type,
      Enabled_Users_Count,
      Disabled_Users_Count,
      License_Expiry,
      Admin_ID,
      Password,
    } = updateData;

    const pool = getTenantDBPool();

    const updateFields = [];
    let request = pool.request().input('tenantId', sql.VarChar, tenantId);

    if (Name !== undefined) {
      updateFields.push('Name = @Name');
      request.input('Name', sql.NVarChar(200), Name);
    }
    if (Licence_Count !== undefined) {
      updateFields.push('Licence_Count = @Licence_Count');
      request.input('Licence_Count', sql.Int, Licence_Count);
    }
    if (License_Type !== undefined) {
      updateFields.push('License_Type = @License_Type');
      request.input('License_Type', sql.VarChar(100), License_Type);
    }
    if (Enabled_Users_Count !== undefined) {
      updateFields.push('Enabled_Users_Count = @Enabled_Users_Count');
      request.input('Enabled_Users_Count', sql.Int, Enabled_Users_Count);
    }
    if (Disabled_Users_Count !== undefined) {
      updateFields.push('Disabled_Users_Count = @Disabled_Users_Count');
      request.input('Disabled_Users_Count', sql.Int, Disabled_Users_Count);
    }
    if (License_Expiry !== undefined) {
      updateFields.push('License_Expiry = @License_Expiry');
      request.input('License_Expiry', sql.Date, License_Expiry);
    }
    if (Admin_ID !== undefined) {
      updateFields.push('Admin_ID = @Admin_ID');
      request.input('Admin_ID', sql.VarChar(100), Admin_ID);
    }
    if (Password !== undefined) {
      updateFields.push('Password = @Password');
      request.input('Password', sql.NVarChar(512), Password);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `UPDATE dbo.TenantInfo SET ${updateFields.join(', ')} WHERE TenantID = @tenantId`;

    await request.query(query);
    return { message: 'Tenant info updated successfully' };
  }

  async updateLicenseCounts(tenantId, enabledUsersCount, disabledUsersCount) {
    const pool = getTenantDBPool();
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('enabledUsersCount', sql.Int, enabledUsersCount)
      .input('disabledUsersCount', sql.Int, disabledUsersCount)
      .query(`
        UPDATE dbo.TenantInfo 
        SET Enabled_Users_Count = @enabledUsersCount, Disabled_Users_Count = @disabledUsersCount 
        WHERE TenantID = @tenantId
      `);

    return { message: 'License counts updated successfully' };
  }

  async updateLicenseExpiry(tenantId, licenseExpiry) {
    const pool = getTenantDBPool();
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('licenseExpiry', sql.Date, licenseExpiry)
      .query('UPDATE dbo.TenantInfo SET License_Expiry = @licenseExpiry WHERE TenantID = @tenantId');

    return { message: 'License expiry updated successfully' };
  }

  async deleteTenant(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('DELETE FROM dbo.TenantInfo WHERE TenantID = @tenantId');

    if (result.rowsAffected[0] === 0) {
      throw new Error('Tenant not found');
    }

    return { message: 'Tenant deleted successfully' };
  }

  async deleteMultipleTenants(tenantIds) {
    if (!Array.isArray(tenantIds)) {
      throw new Error('tenantIds should be an array');
    }

    const pool = getTenantDBPool();
    for (const id of tenantIds) {
      await pool.request()
        .input('tenantId', sql.VarChar, id)
        .query('DELETE FROM dbo.TenantInfo WHERE TenantID = @tenantId');
    }

    return { message: 'Tenants deleted successfully' };
  }

  async getTenantStats(tenantId) {
    const tenantPool = getTenantDBPool();
    const tenantResult = await tenantPool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT * FROM dbo.TenantInfo WHERE TenantID = @tenantId');

    if (tenantResult.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    const userPool = getUserDBPool();
    const userResult = await userPool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query(`
        SELECT 
          COUNT(*) AS TotalUsers,
          SUM(CASE WHEN Status = 'Enabled' THEN 1 ELSE 0 END) AS EnabledUsers,
          SUM(CASE WHEN Status = 'Disabled' THEN 1 ELSE 0 END) AS DisabledUsers
        FROM Users 
        WHERE TenentID = @tenantId
      `);

    const tenant = tenantResult.recordset[0];
    const userStats = userResult.recordset[0];

    return {
      TenantID: tenant.TenantID,
      Name: tenant.Name,
      Licence_Count: tenant.Licence_Count,
      License_Type: tenant.License_Type,
      License_Expiry: tenant.License_Expiry,
      TotalUsers: userStats.TotalUsers,
      EnabledUsers: userStats.EnabledUsers,
      DisabledUsers: userStats.DisabledUsers,
      AvailableLicenses: tenant.Licence_Count - (userStats.EnabledUsers || 0),
      Admin_ID: tenant.Admin_ID
    };
  }
  async validateUser(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT * FROM dbo.TenantInfo WHERE TenantID = @tenantId');

    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = result.recordset[0];
    return {
      username: tenant.Admin_ID,
      password: tenant.Password
    };
  }
}

module.exports = new TenantService();
